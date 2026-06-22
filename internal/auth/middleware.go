package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const cookieName = "session"

func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		signed, err := c.Cookie(cookieName)
		if err != nil {
			c.Set("user_id", int64(0))
			c.Next()
			return
		}

		userID, err := Verify(signed)
		if err != nil {
			c.Set("user_id", int64(0))
			c.Next()
			return
		}

		c.Set("user_id", userID)
		c.Next()
	}
}

func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		OptionalAuth()(c)
		if c.IsAborted() {
			return
		}

		userID, _ := c.Get("user_id")
		if uid, ok := userID.(int64); !ok || uid == 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
			return
		}
	}
}
