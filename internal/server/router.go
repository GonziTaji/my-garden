package server

import (
	"database/sql"
	"io/fs"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"

	"my-garden/internal/domain/plantevents"
	"my-garden/internal/domain/plants"
	"my-garden/internal/domain/plantspecies"
	"my-garden/internal/domain/upload"
	"my-garden/internal/domain/users"
	"my-garden/internal/auth"
	"my-garden/internal/email"
)

type RouterConfig struct {
	WebappFolder  string
	DB            *sql.DB
	Env           EnvType
	SessionSecret string
	SMTPHost      string
	SMTPPort      string
	SMTPUser      string
	SMTPPass      string
	SMTPFrom      string
}

type AppRouter struct {
	cfg       RouterConfig
	webapp_fs fs.FS
	router    *gin.Engine
}

func GetNewRouter(cfg RouterConfig, fsys fs.FS) *gin.Engine {
	webapp_fs, err := fs.Sub(fsys, cfg.WebappFolder)

	if err != nil {
		log.Fatal(err)
	}

	app_router := AppRouter{
		cfg:       cfg,
		router:    gin.Default(),
		webapp_fs: webapp_fs,
	}

	app_router.mountMiddleware()
	app_router.mountApiRoutes()
	app_router.mountStaticFiles()
	app_router.mountFrontend()

	app_router.router.GET("checkhealth", func(ctx *gin.Context) {
		ctx.String(200, "OK!!")
	})

	return app_router.router
}

func (g *AppRouter) mountMiddleware() {
	securityHeaders(g.router)
	if g.cfg.Env == ENV_DEV {
		corsMiddleware(g.router)
	}
}

func (g *AppRouter) mountApiRoutes() {
	api := g.router.Group("/api")

	origin := os.Getenv("MY_GARDEN_ORIGIN")
	if origin == "" {
		if g.cfg.Env == ENV_DEV {
			origin = "http://localhost:8080"
		} else {
			log.Fatal("MY_GARDEN_ORIGIN environment variable is required")
		}
	}

	// Initialize domains
	userStore := users.NewStore(g.cfg.DB)

	var mailer email.Mailer
	if g.cfg.SMTPHost != "" {
		mailer = &email.SMTPMailer{
			Host: g.cfg.SMTPHost,
			Port: g.cfg.SMTPPort,
			User: g.cfg.SMTPUser,
			Pass: g.cfg.SMTPPass,
			From: g.cfg.SMTPFrom,
		}
	} else {
		mailer = &email.ConsoleMailer{}
	}

	userService := users.NewService(userStore, origin, mailer)
	userHandler := users.NewHandler(userService, userStore)

	plantsStore := plants.NewStore(g.cfg.DB)
	plantspeciesStore := plantspecies.NewStore(g.cfg.DB)
	planteventsStore := plantevents.NewStore(g.cfg.DB)

	plantspeciesService := plantspecies.NewService(plantspeciesStore)
	planteventsService := plantevents.NewService(planteventsStore)
	plantsService := plants.NewService(plantsStore, plantspeciesStore, planteventsStore)

	plantspeciesHandler := plantspecies.NewHandler(plantspeciesService)
	planteventsHandler := plantevents.NewHandler(planteventsService)
	plantsHandler := plants.NewHandler(plantsService)

	uploadService := upload.NewService()
	uploadHandler := upload.NewHandler(uploadService)

	// Fully public auth endpoints (no middleware)
	api.POST("/auth/send-link", userHandler.SendLink)
	api.POST("/auth/verify", userHandler.Verify)
	api.POST("/auth/logout", userHandler.Logout)

	// Public group with OptionalAuth (sets userID if session present, never rejects)
	public := api.Group("")
	public.Use(auth.OptionalAuth())
	{
		public.GET("/auth/me", userHandler.Me)
		public.GET("/plant-species", plantspeciesHandler.ListPlantSpecies)
		public.GET("/plant-species/all", plantspeciesHandler.ExplorePlantSpecies)
		public.GET("/plant-species/:id", plantspeciesHandler.GetPlantSpecies)
		public.GET("/enums", plantspeciesHandler.GetEnums)
	}

	// Protected group (rejects with 401 if no valid session)
	protected := api.Group("")
	protected.Use(auth.RequireAuth())
	{
		protected.POST("/plant-species", plantspeciesHandler.CreatePlantSpecies)
		protected.PUT("/plant-species/:id", plantspeciesHandler.UpdatePlantSpecies)
		protected.DELETE("/plant-species/:id", plantspeciesHandler.DeletePlantSpecies)
		protected.POST("/plant-species/:id/favorite", plantspeciesHandler.ToggleFavorite)

		protected.POST("/uploads", uploadHandler.UploadFile)
		protected.DELETE("/uploads/*filepath", uploadHandler.DeleteUploadedFile)

		protected.GET("/plants", plantsHandler.ListPlants)
		protected.GET("/plants/:id", plantsHandler.GetPlant)
		protected.POST("/plants", plantsHandler.CreatePlant)
		protected.PUT("/plants/:id", plantsHandler.UpdatePlant)
		protected.DELETE("/plants/:id", plantsHandler.DeletePlant)

		protected.GET("/plants/:id/events", planteventsHandler.ListEvents)
		protected.POST("/plants/:id/events", planteventsHandler.CreateEvent)
		protected.GET("/plants/:id/events/:eventId", planteventsHandler.GetEventHandler)
		protected.DELETE("/plants/:id/events/:eventId", planteventsHandler.DeleteEvent)
		protected.GET("/plants/:id/events/calendar/:start/:end", planteventsHandler.GetCalendarEvents)
		protected.POST("/events/range", planteventsHandler.GetEventsRange)
		protected.POST("/plants/last-event", planteventsHandler.GetLastEventDates)
	}
}

func (g *AppRouter) mountStaticFiles() {
	g.router.Static("/uploads", "public/uploads")
}

func (g *AppRouter) mountFrontend() {
	g.router.NoRoute(func(ctx *gin.Context) {
		path := ctx.Request.URL.Path

		if strings.HasPrefix(path, "/api/") {
			ctx.Status(http.StatusNotFound)
			return
		}

		filePath := strings.TrimPrefix(path, "/my-garden")
		filePath = strings.TrimPrefix(filePath, "/")
		if filePath == "" {
			filePath = "index.html"
		}

		data, err := fs.ReadFile(g.webapp_fs, filePath)
		if err != nil {
			data, err = fs.ReadFile(g.webapp_fs, "index.html")
			if err != nil {
				ctx.Status(http.StatusNotFound)
				return
			}
			ctx.Data(http.StatusOK, "text/html; charset=utf-8", data)
			return
		}

		ext := filepath.Ext(filePath)
		mimeType := mime.TypeByExtension(ext)
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
		ctx.Data(http.StatusOK, mimeType, data)
	})
}

func corsMiddleware(g *gin.Engine) {
	g.Use(func(ctx *gin.Context) {
		ctx.Header("Access-Control-Allow-Origin", "http://localhost:5173")
		ctx.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		ctx.Header("Access-Control-Allow-Headers", "Content-Type")

		if ctx.Request.Method == http.MethodOptions {
			ctx.AbortWithStatus(http.StatusNoContent)
			return
		}

		ctx.Next()
	})
}

// Based on https://github.com/gin-gonic/examples/blob/master/secure-web-app/main.go
func securityHeaders(g *gin.Engine) {
	cspPolicy := "default-src 'self'; connect-src *; font-src *; " +
		"script-src-elem * 'unsafe-inline'; img-src * data: blob:; style-src * 'unsafe-inline';"

	permPolicy := "geolocation=(),midi=(),sync-xhr=(),microphone=(),camera=()," +
		"magnetometer=(),gyroscope=(),fullscreen=(self),payment=()"

	header_value_pairs := [][2]string{
		{"Referrer-Policy", "strict-origin"},
		{"Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"},
		{"Content-Security-Policy", cspPolicy},
		{"Permissions-Policy", permPolicy},
		{"X-Frame-Options", "DENY"},
		{"X-XSS-Protection", "1; mode=block"},
		{"X-Content-Type-Options", "nosniff"},
	}

	g.Use(func(ctx *gin.Context) {
		for _, pair := range header_value_pairs {
			var (
				key   = pair[0]
				value = pair[1]
			)

			ctx.Header(key, value)
		}

		ctx.Next()
	})
}
