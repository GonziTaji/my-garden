package plantspecies

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func userIDFromContext(c *gin.Context) int64 {
	uid, exists := c.Get("user_id")
	if !exists {
		return 0
	}
	id, ok := uid.(int64)
	if !ok {
		return 0
	}
	return id
}

func (h *Handler) GetEnums(c *gin.Context) {
	c.JSON(http.StatusOK, AllEnums())
}

func (h *Handler) ExplorePlantSpecies(c *gin.Context) {
	species, err := h.service.ListSpecies(0, "")
	if err != nil {
		log.Printf("Error: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al listar tipos de planta"})
		return
	}
	c.JSON(http.StatusOK, species)
}

func (h *Handler) ListPlantSpecies(c *gin.Context) {
	userID := userIDFromContext(c)
	scope := c.Query("scope")
	species, err := h.service.ListSpecies(userID, scope)
	if err != nil {
		log.Printf("Error: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al listar tipos de planta"})
		return
	}
	c.JSON(http.StatusOK, species)
}

func (h *Handler) GetPlantSpecies(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	userID := userIDFromContext(c)
	sp, err := h.service.GetSpecies(id, userID)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusNotFound, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener tipo de planta"})
		return
	}

	c.JSON(http.StatusOK, sp)
}

func (h *Handler) CreatePlantSpecies(c *gin.Context) {
	var input UpsertSpeciesInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	userID := userIDFromContext(c)
	sp, err := h.service.CreateSpecies(input, userID)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		var uniqueErr *UniqueConstraintError
		if errors.As(err, &uniqueErr) {
			c.JSON(http.StatusConflict, gin.H{"error": uniqueErr.Message, "field": uniqueErr.Field})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear tipo de planta"})
		return
	}

	c.JSON(http.StatusCreated, sp)
}

func (h *Handler) UpdatePlantSpecies(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	var input UpsertSpeciesInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	userID := userIDFromContext(c)
	sp, err := h.service.UpdateSpecies(id, input, userID)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		var uniqueErr *UniqueConstraintError
		if errors.As(err, &uniqueErr) {
			c.JSON(http.StatusConflict, gin.H{"error": uniqueErr.Message, "field": uniqueErr.Field})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar tipo de planta"})
		return
	}

	c.JSON(http.StatusOK, sp)
}

func (h *Handler) DeletePlantSpecies(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	userID := userIDFromContext(c)
	if err := h.service.DeleteSpecies(id, userID); err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusNotFound, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar tipo de planta"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *Handler) ToggleFavorite(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	userID := userIDFromContext(c)
	favorited, err := h.service.ToggleFavorite(id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cambiar favorito"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"favorited": favorited})
}
