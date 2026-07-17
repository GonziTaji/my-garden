package users

import (
	"database/sql"
	"fmt"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

func (s *Store) GetUserByEmail(email string) (*User, error) {
	row := s.db.QueryRow(`
		select id, email, username, created_at, updated_at
		from users
		where email = ?
	`, email)
	var u User
	err := row.Scan(&u.ID, &u.Email, &u.Username, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &u, nil
}

func (s *Store) GetUserByID(id int64) (*User, error) {
	row := s.db.QueryRow(`
		select id, email, username, created_at, updated_at
		from users
		where id = ?
	`, id)
	var u User
	err := row.Scan(&u.ID, &u.Email, &u.Username, &u.CreatedAt, &u.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &u, nil
}

func (s *Store) CreateUser(email, username string) (int64, error) {
	result, err := s.db.Exec(`
		insert into users (email, username)
		values (?, ?)
	`, email, username)
	if err != nil {
		return 0, fmt.Errorf("create user: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("get last insert id: %w", err)
	}
	return id, nil
}

func (s *Store) CreateAuthToken(email, tokenHash, expiresAt string) (int64, error) {
	result, err := s.db.Exec(`
		insert into auth_tokens (email, token_hash, expires_at)
		values (?, ?, ?)
	`, email, tokenHash, expiresAt)
	if err != nil {
		return 0, fmt.Errorf("create auth token: %w", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("get last insert id: %w", err)
	}
	return id, nil
}

func (s *Store) GetRecentAuthTokenByEmail(email string) (*AuthToken, error) {
	row := s.db.QueryRow(`
		select id, email, token_hash, expires_at, used_at, created_at
		from auth_tokens
		where email = ?
		and datetime(created_at) > datetime('now', '-2 minutes', 'localtime')
		and used_at is null
		order by created_at desc
		limit 1
	`, email)
	var t AuthToken
	var usedAt sql.NullString
	err := row.Scan(&t.ID, &t.Email, &t.TokenHash, &t.ExpiresAt, &usedAt, &t.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get recent auth token: %w", err)
	}
	if usedAt.Valid {
		t.UsedAt = &usedAt.String
	}
	return &t, nil
}

func (s *Store) GetAuthTokenByHash(tokenHash string) (*AuthToken, error) {
	row := s.db.QueryRow(`
		select id, email, token_hash, expires_at, used_at, created_at
		from auth_tokens
		where token_hash = ?
	`, tokenHash)
	var t AuthToken
	var usedAt sql.NullString
	err := row.Scan(&t.ID, &t.Email, &t.TokenHash, &t.ExpiresAt, &usedAt, &t.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get auth token: %w", err)
	}
	if usedAt.Valid {
		t.UsedAt = &usedAt.String
	}
	return &t, nil
}

func (s *Store) MarkAuthTokenUsed(id int64) error {
	_, err := s.db.Exec(`
		update auth_tokens set used_at = datetime('now', 'localtime')
		where id = ?
	`, id)
	if err != nil {
		return fmt.Errorf("mark auth token used: %w", err)
	}
	return nil
}
