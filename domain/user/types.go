package user

type User struct {
	ID        int64  `json:"id"`
	Email     string `json:"email"`
	Username  string `json:"username"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type AuthToken struct {
	ID        int64
	Email     string
	TokenHash string
	ExpiresAt string
	UsedAt    *string
	CreatedAt string
}

type SendLinkRequest struct {
	Email string `json:"email" binding:"required"`
}

type VerifyCodeRequest struct {
	Code string `json:"code" binding:"required"`
}

type UserResponse struct {
	ID       int64  `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
}
