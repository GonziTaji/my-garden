package server

import (
	"database/sql"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"

	"my-garden/domain/plant"
	"my-garden/domain/user"
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
	userStore := user.NewStore(g.cfg.DB)

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

	userService := user.NewService(userStore, origin, mailer)
	userHandler := user.NewHandler(userService, userStore)

	plantStore := plant.NewStore(g.cfg.DB)
	plantService := plant.NewService(plantStore)
	plantHandler := plant.NewHandler(plantService)

	// Fully public auth endpoints (no middleware)
	api.POST("/auth/send-link", userHandler.SendLink)
	api.POST("/auth/verify", userHandler.Verify)
	api.POST("/auth/logout", userHandler.Logout)

	// Public group with OptionalAuth (sets userID if session present, never rejects)
	public := api.Group("")
	public.Use(auth.OptionalAuth())
	{
		public.GET("/auth/me", userHandler.Me)
		public.GET("/plant-definitions", plantHandler.ListPlantDefinitions)
		public.GET("/plant-definitions/:id", plantHandler.GetPlantDefinition)
		public.GET("/enums", plantHandler.GetEnums)
	}

	// Protected group (rejects with 401 if no valid session)
	protected := api.Group("")
	protected.Use(auth.RequireAuth())
	{
		protected.POST("/plant-definitions", plantHandler.CreatePlantDefinition)
		protected.PUT("/plant-definitions/:id", plantHandler.UpdatePlantDefinition)
		protected.DELETE("/plant-definitions/:id", plantHandler.DeletePlantDefinition)
		protected.POST("/plant-definitions/:id/clone", plantHandler.ClonePlantDefinition)
		protected.POST("/plant-definitions/:id/favorite", plantHandler.ToggleFavorite)

		protected.POST("/upload/plant-definition-image", plantHandler.UploadPlantDefinitionImage)
		protected.POST("/upload/plant-image", plantHandler.UploadPlantImage)

		protected.GET("/plants", plantHandler.ListPlants)
		protected.GET("/plants/:id", plantHandler.GetPlant)
		protected.POST("/plants", plantHandler.CreatePlant)
		protected.PUT("/plants/:id", plantHandler.UpdatePlant)
		protected.DELETE("/plants/:id", plantHandler.DeletePlant)

		protected.POST("/plants/:id/images", plantHandler.AddPlantImage)
		protected.DELETE("/plants/:id/images/:imageId", plantHandler.DeletePlantImage)

		protected.GET("/plants/:id/events", plantHandler.ListEvents)
		protected.POST("/plants/:id/events", plantHandler.CreateEvent)
		protected.GET("/plants/:id/events/:eventId", plantHandler.GetEventHandler)
		protected.DELETE("/plants/:id/events/:eventId", plantHandler.DeleteEvent)
		protected.GET("/plants/:id/events/calendar/:start/:end", plantHandler.GetCalendarEvents)
		protected.POST("/events/range", plantHandler.GetEventsRange)
		protected.POST("/plants/last-event", plantHandler.GetLastEventDates)
	}
}

func (g *AppRouter) mountStaticFiles() {
	g.router.Static("/uploads", "public/uploads")
}

func (g *AppRouter) mountFrontend() {
	assetsFs, err := fs.Sub(g.webapp_fs, "assets")
	if err != nil {
		log.Fatal(err)
	}
	g.router.StaticFS("/assets", http.FS(assetsFs))
	g.router.StaticFileFS("/favicon.svg", "favicon.svg", http.FS(g.webapp_fs))
	g.router.StaticFileFS("/icons.svg", "icons.svg", http.FS(g.webapp_fs))

	g.router.NoRoute(func(ctx *gin.Context) {
		if strings.HasPrefix(ctx.Request.URL.Path, "/api/") {
			ctx.Status(http.StatusNotFound)
			return
		}

		data, err := fs.ReadFile(g.webapp_fs, "index.html")
		if err != nil {
			ctx.Status(http.StatusNotFound)
			return
		}
		ctx.Data(http.StatusOK, "text/html; charset=utf-8", data)
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
