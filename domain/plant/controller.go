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

// Plant Definitions

func (h *Handler) ListPlantDefinitions(c *gin.Context) {
	userID := userIDFromContext(c)
	defs, err := h.service.ListDefinitions(userID)
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

	userID := userIDFromContext(c)
	def, err := h.service.GetDefinition(id, userID)
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

func (h *Handler) GetJournalCalendar(c *gin.Context) {
	plantId, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	var input PlantCalendarInput

	input.plantId = plantId
	input.userId = userIDFromContext(c)

	input.startDate = c.Param("startdate")
	input.endDate = c.Param("enddate")

	calendar, err := h.service.GetPlantCalendar(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, calendar)
}

func (h *Handler) CreatePlantDefinition(c *gin.Context) {
	var input UpsertDefinitionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	userID := userIDFromContext(c)
	def, err := h.service.CreateDefinition(input, userID)
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

	userID := userIDFromContext(c)
	def, err := h.service.UpdateDefinition(id, input, userID)
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

	userID := userIDFromContext(c)
	if err := h.service.DeleteDefinition(id, userID); err != nil {
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

func (h *Handler) ClonePlantDefinition(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID invalido"})
		return
	}

	userID := userIDFromContext(c)
	def, err := h.service.CloneDefinition(id, userID)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusNotFound, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al clonar tipo de planta"})
		return
	}

	c.JSON(http.StatusCreated, def)
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

// Image Upload

func (h *Handler) DeletePlantImage(c *gin.Context) {
	imageID, err := strconv.ParseInt(c.Param("imageId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de imagen invalido"})
		return
	}

	if err := h.service.DeletePlantImage(imageID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar imagen"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *Handler) AddPlantImage(c *gin.Context) {
	plantID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de planta invalido"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Archivo no encontrado en la solicitud"})
		return
	}

	userID := userIDFromContext(c)
	result, err := h.service.AddPlantImage(plantID, file, userID)
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

func (h *Handler) UploadPlantImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Archivo no encontrado en la solicitud"})
		return
	}

	result, err := h.service.UploadPlantImage(file)
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

	userID := userIDFromContext(c)
	plants, err := h.service.ListPlants(defID, userID)
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

	userID := userIDFromContext(c)
	plant, err := h.service.GetPlant(id, userID)
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

	userID := userIDFromContext(c)
	plant, err := h.service.CreatePlant(input, userID)
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

	userID := userIDFromContext(c)
	plant, err := h.service.UpdatePlant(id, input, userID)
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

	userID := userIDFromContext(c)
	if err := h.service.DeletePlant(id, userID); err != nil {
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

	userID := userIDFromContext(c)
	entry, err := h.service.CreateLocationChange(input, userID)
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
	plantID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de planta invalido"})
		return
	}

	date := c.Param("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Fecha requerida"})
		return
	}

	userID := userIDFromContext(c)
	entry, err := h.service.WaterPlant(plantID, date, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al registrar riego"})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

func (h *Handler) DeleteWatering(c *gin.Context) {
	plantID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de planta invalido"})
		return
	}

	date := c.Param("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Fecha requerida"})
		return
	}

	if err := h.service.DeleteWatering(plantID, date); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar riego"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *Handler) ToggleWatering(c *gin.Context) {
	plantID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de planta invalido"})
		return
	}

	var input struct {
		Date string `json:"date"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	userID := userIDFromContext(c)
	result, err := h.service.ToggleWatering(plantID, input.Date, userID)
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

	userID := userIDFromContext(c)
	if err := h.service.BulkWaterPlants(input, userID); err != nil {
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
