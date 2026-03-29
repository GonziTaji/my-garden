package server

import (
	"errors"
	"io/fs"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type RouterConfig struct {
	WebappFolder string
	StaticFolder string
}

type AppRouter struct {
	cfg       RouterConfig
	webapp_fs fs.FS
	static_fs fs.FS
	router    *gin.Engine
}

func GetNewRouter(cfg RouterConfig, fsys fs.FS) *gin.Engine {
	webapp_fs, err := fs.Sub(fsys, cfg.WebappFolder)

	if err != nil {
		log.Fatal(err)
	}

	static_fs, err := fs.Sub(fsys, cfg.StaticFolder)

	if err != nil {
		log.Fatal(err)
	}

	app_router := AppRouter{
		cfg:       cfg,
		router:    gin.Default(),
		webapp_fs: webapp_fs,
		static_fs: static_fs,
	}

	// always at the start
	app_router.registerSecutiryHeaders()

	app_router.registerApiRoutes()
	app_router.registerWebappFiles()
	app_router.registerStaticFiles()

	return app_router.router
}

func (g *AppRouter) registerApiRoutes() {
	// TODO: register router when api exists
	// g:=router.Group("/api")
}

func (g *AppRouter) registerWebappFiles() {
	g.router.NoRoute(func(ctx *gin.Context) {
		requested_path := ctx.Request.URL.Path

		if requested_path == "/" {
			ctx.FileFromFS("/", http.FS(g.webapp_fs))
			return
		}

		trimmed_requested_path := strings.TrimSuffix(strings.TrimPrefix(requested_path, "/"), "/")

		_, err := fs.Stat(g.webapp_fs, trimmed_requested_path)

		if errors.Is(err, fs.ErrNotExist) {
			ctx.AbortWithStatus(404)
			return
		}

		if err != nil {
			ctx.AbortWithError(500, err)
			return
		}

		ctx.FileFromFS(requested_path, http.FS(g.webapp_fs))
	})
}

func (g *AppRouter) registerStaticFiles() {
	g.router.StaticFS("/static", http.FS(g.static_fs))
}

// Based on https://github.com/gin-gonic/examples/blob/master/secure-web-app/main.go
func (g *AppRouter) registerSecutiryHeaders() {
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

	g.router.Use(func(ctx *gin.Context) {
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
