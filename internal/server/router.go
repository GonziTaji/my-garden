package server

import (
	"database/sql"
	"io/fs"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"my-garden/domain/plant"
)

type RouterConfig struct {
	WebappFolder string
	DB           *sql.DB
	Env          EnvType
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
		ctx.String(200, "OK")
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

	store := plant.NewStore(g.cfg.DB)
	service := plant.NewService(store)
	handler := plant.NewHandler(service)
	plant.RegisterRoutes(api, handler)
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
