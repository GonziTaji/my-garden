package upload

import (
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Archivo no encontrado en la solicitud"})
		return
	}

	result, err := h.service.UploadFile(file)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			log.Printf("Error: %s\n", err)
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		log.Printf("Error: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al subir imagen"})
		return
	}

	c.JSON(http.StatusCreated, result)
}

func (h *Handler) DeleteUploadedFile(c *gin.Context) {
	fp := c.Param("filepath")
	if fp == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ruta de archivo requerida"})
		return
	}

	if err := h.service.DeleteFile(fp); err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			log.Printf("Error: %s\n", err)
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}

		log.Printf("Error: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error al eliminar archivo: %s", err.Error())})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
