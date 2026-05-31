package plant

import "github.com/gin-gonic/gin"

func RegisterRoutes(rg *gin.RouterGroup, handler *Handler) {
	rg.GET("/enums", handler.GetEnums)

	// Plant Definitions
	rg.GET("/plant-definitions", handler.ListPlantDefinitions)
	rg.GET("/plant-definitions/:id", handler.GetPlantDefinition)
	rg.POST("/plant-definitions", handler.CreatePlantDefinition)
	rg.PUT("/plant-definitions/:id", handler.UpdatePlantDefinition)
	rg.DELETE("/plant-definitions/:id", handler.DeletePlantDefinition)

	// Image Upload
	rg.POST("/upload/plant-definition-image", handler.UploadPlantDefinitionImage)

	// Plants
	rg.GET("/plants", handler.ListPlants)
	rg.GET("/plants/:id", handler.GetPlant)
	rg.POST("/plants", handler.CreatePlant)
	rg.PUT("/plants/:id", handler.UpdatePlant)
	rg.DELETE("/plants/:id", handler.DeletePlant)

	// Location History
	rg.POST("/plants/:id/location", handler.CreateLocationChange)

	// Journal entries for a plant
	rg.GET("/plants/:id/journal", handler.GetJournalEntries)

	// Watering
	rg.POST("/journal/watering", handler.WaterPlant)
	rg.DELETE("/journal/watering", handler.DeleteWatering)
	rg.POST("/journal/watering/toggle", handler.ToggleWatering)
	rg.POST("/journal/watering/bulk", handler.BulkWaterPlants)
	rg.POST("/journal/last-watered", handler.GetLastWateredDates)
	rg.POST("/journal/watering/range", handler.GetWateringHistoryByDateRange)
}
