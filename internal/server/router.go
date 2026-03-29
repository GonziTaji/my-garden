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
	cfg    RouterConfig
	fs     fs.FS
	router *gin.Engine
}

func GetNewRouter(cfg RouterConfig, fsys fs.FS) *gin.Engine {
	app_router := AppRouter{
		cfg:    cfg,
		router: gin.Default(),
		fs:     fsys,
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
	webapp_fs, err := fs.Sub(g.fs, g.cfg.WebappFolder)

	if err != nil {
		log.Fatal(err)
	}

	http_webapp_fs := http.FS(webapp_fs)

	_ = fs.WalkDir(webapp_fs, ".", func(path string, d fs.DirEntry, err error) error {
		log.Printf("\t%s\n", path)
		return nil
	})

	g.router.NoRoute(func(ctx *gin.Context) {
		requested_path := ctx.Request.URL.Path

		if requested_path == "/" {
			ctx.FileFromFS("/", http_webapp_fs)
			return
		}

		trimmed_requested_path := strings.TrimSuffix(strings.TrimPrefix(requested_path, "/"), "/")

		_, err := fs.Stat(webapp_fs, trimmed_requested_path)

		if errors.Is(err, fs.ErrNotExist) {
			ctx.AbortWithStatus(404)
			return
		}

		if err != nil {
			ctx.AbortWithError(500, err)
			return
		}

		ctx.FileFromFS(requested_path, http_webapp_fs)
	})
}

func (g *AppRouter) registerStaticFiles() {
	g.router.Static("/static", g.cfg.StaticFolder)
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
