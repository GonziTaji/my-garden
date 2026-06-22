package user

import "github.com/gin-gonic/gin"

func RegisterRoutes(rg *gin.RouterGroup, handler *Handler) {
	rg.POST("/auth/send-link", handler.SendLink)
	rg.GET("/auth/verify", handler.Verify)
	rg.POST("/auth/logout", handler.Logout)
	rg.GET("/auth/me", handler.Me)
}
