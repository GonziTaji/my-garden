package users

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"my-garden/internal/auth"
)

type Handler struct {
	service *Service
	store   *Store
}

func NewHandler(service *Service, store *Store) *Handler {
	return &Handler{service: service, store: store}
}

func (h *Handler) SendLink(c *gin.Context) {
	var req SendLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	result, err := h.service.RequestLogin(req.Email)
	if err != nil {
		log.Printf("Error: %s\n", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send link"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) Verify(c *gin.Context) {
	var req VerifyCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code is required"})
		return
	}

	result, err := h.service.VerifyLogin(strings.ToUpper(req.Code))
	if err != nil {
		log.Printf("Error: %s\n", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	auth.SetSessionCookie(c, result.User.ID)
	c.JSON(http.StatusOK, result.User)
}

func (h *Handler) Logout(c *gin.Context) {
	auth.ClearSessionCookie(c)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

func (h *Handler) Me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.Status(http.StatusNoContent)
		return
	}
	uid, ok := userID.(int64)
	if !ok || uid == 0 {
		c.Status(http.StatusNoContent)
		return
	}

	user, err := h.store.GetUserByID(uid)
	if err != nil || user == nil {
		log.Printf("Error: %s\n", err)
		c.Status(http.StatusNoContent)
		return
	}

	c.JSON(http.StatusOK, UserResponse{
		ID:       user.ID,
		Email:    user.Email,
		Username: user.Username,
	})
}
