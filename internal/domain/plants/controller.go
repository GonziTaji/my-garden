package plants

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

func (h *Handler) ListPlants(c *gin.Context) {
	var speciesID *int64
	if s := c.Query("plant_species_id"); s != "" {
		id, err := strconv.ParseInt(s, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "plant_species_id invalido"})
			return
		}
		speciesID = &id
	}

	userID := userIDFromContext(c)
	plants, err := h.service.ListPlants(speciesID, userID)
	if err != nil {
		log.Printf("Error: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al listar plantas"})
		return
	}

	c.JSON(http.StatusOK, plants)
}

func (h *Handler) GetPlant(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	userID := userIDFromContext(c)
	plant, err := h.service.GetPlant(id, userID)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			log.Printf("Error: %s\n", err)
			c.JSON(http.StatusNotFound, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		log.Printf("Error: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener planta"})
		return
	}

	c.JSON(http.StatusOK, plant)
}

func (h *Handler) CreatePlant(c *gin.Context) {
	var input CreatePlantInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	userID := userIDFromContext(c)
	plant, err := h.service.CreatePlant(input, userID)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			log.Printf("Error: %s\n", err)
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		log.Printf("Error: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear planta"})
		return
	}

	c.JSON(http.StatusCreated, plant)
}

func (h *Handler) UpdatePlant(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	var input UpdatePlantInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	userID := userIDFromContext(c)
	plant, err := h.service.UpdatePlant(id, input, userID)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			log.Printf("Error: %s\n", err)
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		log.Printf("Error: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al actualizar planta"})
		return
	}

	c.JSON(http.StatusOK, plant)
}

func (h *Handler) DeletePlant(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	userID := userIDFromContext(c)
	if err := h.service.DeletePlant(id, userID); err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			log.Printf("Error: %s\n", err)
			c.JSON(http.StatusNotFound, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		log.Printf("Error: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar planta"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
