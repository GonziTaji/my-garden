package plant

import (
	"errors"
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

func (h *Handler) GetEnums(c *gin.Context) {
	c.JSON(http.StatusOK, AllEnums())
}

// Plant Definitions

func (h *Handler) ListPlantDefinitions(c *gin.Context) {
	defs, err := h.service.ListDefinitions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al listar tipos de planta"})
		return
	}
	c.JSON(http.StatusOK, defs)
}

func (h *Handler) GetPlantDefinition(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	def, err := h.service.GetDefinition(id)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusNotFound, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener tipo de planta"})
		return
	}

	c.JSON(http.StatusOK, def)
}

func (h *Handler) CreatePlantDefinition(c *gin.Context) {
	var input UpsertDefinitionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	def, err := h.service.CreateDefinition(input)
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

	c.JSON(http.StatusCreated, def)
}

func (h *Handler) UpdatePlantDefinition(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	var input UpsertDefinitionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	def, err := h.service.UpdateDefinition(id, input)
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

	c.JSON(http.StatusOK, def)
}

func (h *Handler) DeletePlantDefinition(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	if err := h.service.DeleteDefinition(id); err != nil {
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

// Image Upload

func (h *Handler) UploadPlantDefinitionImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Archivo no encontrado en la solicitud"})
		return
	}

	result, err := h.service.UploadImage(file)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al subir imagen"})
		return
	}

	c.JSON(http.StatusCreated, result)
}

// Plants

func (h *Handler) ListPlants(c *gin.Context) {
	var defID *int64
	if s := c.Query("plant_definition_id"); s != "" {
		id, err := strconv.ParseInt(s, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "plant_definition_id invalido"})
			return
		}
		defID = &id
	}

	plants, err := h.service.ListPlants(defID)
	if err != nil {
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

	plant, err := h.service.GetPlant(id)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusNotFound, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
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

	plant, err := h.service.CreatePlant(input)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
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

	plant, err := h.service.UpdatePlant(id, input)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
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

	if err := h.service.DeletePlant(id); err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusNotFound, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar planta"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// Location History

func (h *Handler) CreateLocationChange(c *gin.Context) {
	var input CreateLocationChangeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	entry, err := h.service.CreateLocationChange(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar cambio de ubicacion"})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

// Journal / Watering

func (h *Handler) GetJournalEntries(c *gin.Context) {
	plantID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de planta invalido"})
		return
	}

	entries, err := h.service.GetJournalEntries(plantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener historial"})
		return
	}

	c.JSON(http.StatusOK, entries)
}

func (h *Handler) WaterPlant(c *gin.Context) {
	var input WaterEntryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	entry, err := h.service.WaterPlant(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar riego"})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

func (h *Handler) DeleteWatering(c *gin.Context) {
	var input DeleteWateringInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	if err := h.service.DeleteWatering(input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar riego"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *Handler) ToggleWatering(c *gin.Context) {
	var input struct {
		PlantID int64  `json:"plant_id"`
		Date    string `json:"date"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	result, err := h.service.ToggleWatering(input.PlantID, input.Date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al cambiar riego"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) BulkWaterPlants(c *gin.Context) {
	var input BulkWaterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	if err := h.service.BulkWaterPlants(input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al regar plantas"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *Handler) GetLastWateredDates(c *gin.Context) {
	var input struct {
		PlantIDs []int64 `json:"plant_ids"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	dates, err := h.service.GetLastWateredDates(input.PlantIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener ultimos riegos"})
		return
	}

	c.JSON(http.StatusOK, dates)
}

func (h *Handler) GetWateringHistoryByDateRange(c *gin.Context) {
	var input WateringRangeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	entries, err := h.service.GetWateringHistoryByDateRange(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener historial de riegos"})
		return
	}

	c.JSON(http.StatusOK, entries)
}
