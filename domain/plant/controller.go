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

// Plant Species
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

// Plants

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
