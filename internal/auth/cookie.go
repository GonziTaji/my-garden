package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func sessionSecret() []byte {
	secret := os.Getenv("MY_GARDEN_SESSION_SECRET")
	if secret == "" {
		panic("MY_GARDEN_SESSION_SECRET environment variable is required")
	}
	return []byte(secret)
}

func Sign(userID int64) (string, error) {
	mac := hmac.New(sha256.New, sessionSecret())
	payload := strconv.FormatInt(userID, 10)
	mac.Write([]byte(payload))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("%s.%s", payload, sig), nil
}

func Verify(signed string) (int64, error) {
	dot := strings.LastIndex(signed, ".")
	if dot < 0 {
		return 0, fmt.Errorf("invalid cookie format")
	}
	payload := signed[:dot]
	sig, err := base64.RawURLEncoding.DecodeString(signed[dot+1:])
	if err != nil {
		return 0, fmt.Errorf("invalid cookie signature encoding: %w", err)
	}

	mac := hmac.New(sha256.New, sessionSecret())
	mac.Write([]byte(payload))
	expected := mac.Sum(nil)
	if !hmac.Equal(sig, expected) {
		return 0, fmt.Errorf("invalid cookie signature")
	}

	userID, err := strconv.ParseInt(payload, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid user id in cookie: %w", err)
	}
	return userID, nil
}

func SetSessionCookie(c *gin.Context, userID int64) {
	signed, err := Sign(userID)
	if err != nil {
		return
	}
	c.SetCookie("session", signed, 86400*30, "/", "", false, true)
}

func ClearSessionCookie(c *gin.Context) {
	c.SetCookie("session", "", -1, "/", "", false, true)
}
