package user

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"my-garden/internal/auth"
	"my-garden/internal/email"
)

type Service struct {
	store   *Store
	origin  string
	mailer  email.Mailer
}

func NewService(store *Store, origin string, mailer email.Mailer) *Service {
	return &Service{store: store, origin: origin, mailer: mailer}
}

type SendLinkResult struct {
	Message string `json:"message"`
	Link    string `json:"link,omitempty"`
}

func (s *Service) RequestLogin(email string) (*SendLinkResult, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return nil, fmt.Errorf("email is required")
	}

	recent, err := s.store.GetRecentAuthTokenByEmail(email)
	if err != nil {
		return nil, fmt.Errorf("check recent token: %w", err)
	}
	if recent != nil {
		return nil, fmt.Errorf("a token was already sent recently, please wait before requesting a new one")
	}

	token := make([]byte, 32)
	if _, err := rand.Read(token); err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	rawToken := hex.EncodeToString(token)
	tokenHash := fmt.Sprintf("%x", sha256.Sum256([]byte(rawToken)))
	expiresAt := time.Now().UTC().Add(15 * time.Minute).Format("2006-01-02 15:04:05")

	if _, err := s.store.CreateAuthToken(email, tokenHash, expiresAt); err != nil {
		return nil, fmt.Errorf("store auth token: %w", err)
	}

	magicLink := fmt.Sprintf("%s/api/auth/verify?token=%s", s.origin, rawToken)

	subject := "Tu enlace mágico para My Garden"
	body := fmt.Sprintf(`Hola,

Usa este enlace para iniciar sesión en My Garden:

%s

Este enlace expira en 15 minutos.

Si no solicitaste esto, ignora este correo.`, magicLink)

	if err := s.mailer.Send(email, subject, body); err != nil {
		return nil, fmt.Errorf("send email: %w", err)
	}

	return &SendLinkResult{
		Message: "If that email is registered, a magic link has been sent.",
		Link:    magicLink,
	}, nil
}

type VerifyResult struct {
	SignedCookie string
	User         *UserResponse
}

func (s *Service) VerifyLogin(rawToken string) (*VerifyResult, error) {
	tokenHash := fmt.Sprintf("%x", sha256.Sum256([]byte(rawToken)))

	tok, err := s.store.GetAuthTokenByHash(tokenHash)
	if err != nil {
		return nil, fmt.Errorf("lookup token: %w", err)
	}
	if tok == nil {
		return nil, fmt.Errorf("invalid or expired token")
	}
	if tok.UsedAt != nil {
		return nil, fmt.Errorf("token already used")
	}

	expiresAt, err := time.Parse("2006-01-02 15:04:05", tok.ExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("parse expiry: %w", err)
	}
	if time.Now().UTC().After(expiresAt) {
		return nil, fmt.Errorf("token expired")
	}

	user, err := s.store.GetUserByEmail(tok.Email)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	if user == nil {
		username := strings.Split(tok.Email, "@")[0]
		id, err := s.store.CreateUser(tok.Email, username)
		if err != nil {
			return nil, fmt.Errorf("create user: %w", err)
		}
		user = &User{
			ID:       id,
			Email:    tok.Email,
			Username: username,
		}
	}

	if err := s.store.MarkAuthTokenUsed(tok.ID); err != nil {
		return nil, fmt.Errorf("mark token used: %w", err)
	}

	signedCookie, err := auth.Sign(user.ID)
	if err != nil {
		return nil, fmt.Errorf("sign cookie: %w", err)
	}

	return &VerifyResult{
		SignedCookie: signedCookie,
		User: &UserResponse{
			ID:       user.ID,
			Email:    user.Email,
			Username: user.Username,
		},
	}, nil
}
