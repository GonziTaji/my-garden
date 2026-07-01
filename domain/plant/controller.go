package plant

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

// Plant Definitions
func (h *Handler) ExplorePlantDefinitions(c *gin.Context) {
	defs, err := h.service.ListDefinitions(0)
	if err != nil {
		log.Printf("Error: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al listar tipos de planta"})
		return
	}
	c.JSON(http.StatusOK, defs)
}

func (h *Handler) ListPlantDefinitions(c *gin.Context) {
	userID := userIDFromContext(c)
	defs, err := h.service.ListDefinitions(userID)
	if err != nil {
		log.Printf("Error: %s\n", err)
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

// Events

func (h *Handler) ListEvents(c *gin.Context) {
	plantID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de planta invalido"})
		return
	}

	userID := userIDFromContext(c)
	events, err := h.service.ListEvents(plantID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al listar eventos"})
		return
	}

	c.JSON(http.StatusOK, events)
}

func (h *Handler) CreateEvent(c *gin.Context) {
	plantID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de planta invalido"})
		return
	}

	var input CreateEventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	userID := userIDFromContext(c)
	event, err := h.service.CreateEvent(input, plantID, userID)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear evento"})
		return
	}

	c.JSON(http.StatusCreated, event)
}

func (h *Handler) GetEventHandler(c *gin.Context) {
	eventID, err := strconv.ParseInt(c.Param("eventId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de evento invalido"})
		return
	}

	userID := userIDFromContext(c)
	event, err := h.service.GetEvent(eventID, userID)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusNotFound, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener evento"})
		return
	}

	c.JSON(http.StatusOK, event)
}

func (h *Handler) DeleteEvent(c *gin.Context) {
	eventID, err := strconv.ParseInt(c.Param("eventId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de evento invalido"})
		return
	}

	userID := userIDFromContext(c)
	if err := h.service.DeleteEvent(eventID, userID); err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			c.JSON(http.StatusNotFound, gin.H{"error": valErr.Message, "field": valErr.Field})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar evento"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *Handler) GetCalendarEvents(c *gin.Context) {
	plantID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de planta invalido"})
		return
	}

	start := c.Param("start")
	end := c.Param("end")
	userID := userIDFromContext(c)
	entries, err := h.service.GetCalendarEvents(plantID, start, end, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener calendario"})
		return
	}

	c.JSON(http.StatusOK, entries)
}

func (h *Handler) GetEventsRange(c *gin.Context) {
	var input EventsRangeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	userID := userIDFromContext(c)
	events, err := h.service.GetEventsRange(input, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener eventos"})
		return
	}

	c.JSON(http.StatusOK, events)
}

func (h *Handler) GetLastEventDates(c *gin.Context) {
	var input struct {
		PlantIDs  []int64 `json:"plant_ids"`
		EventType *string `json:"event_type,omitempty"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de solicitud invalido"})
		return
	}

	dates, err := h.service.GetLastEventDates(input.PlantIDs, input.EventType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener ultimas fechas"})
		return
	}

	c.JSON(http.StatusOK, dates)
}
