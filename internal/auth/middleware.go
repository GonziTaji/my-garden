package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const cookieName = "session"

func getUserID(c *gin.Context) int64 {
	signed, err := c.Cookie(cookieName)
	if err != nil {
		return 0
	}

	userID, err := Verify(signed)
	if err != nil {
		return 0
	}

	return userID
}

func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("user_id", getUserID(c))
		c.Next()
	}
}

func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := getUserID(c)
		if userID == 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
			return
		}
		c.Set("user_id", userID)
		c.Next()
	}
}
