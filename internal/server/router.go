package server

import (
	"encoding/json"
	"io"
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

var webappEntryPages []PageFileDescriptor

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
	app_router.registerWebappAssets()
	app_router.registerWebappTemplates()
	app_router.registerStaticFiles()

	return app_router.router
}

func (g *AppRouter) registerApiRoutes() {
	// TODO: register router when api exists
	// g:=router.Group("/api")
}

type ManifestEntry struct {
	IsEntry bool   `json:"isEntry"`
	Name    string `json:"name"`
	Src     string `json:"src"`
}

type PageFileDescriptor struct {
	Name string
	Src  string
}

func (g *AppRouter) registerWebappTemplates() {
	manifest, err := g.webapp_fs.Open(".vite/manifest.json")
	if err != nil {
		log.Fatal(err)
	}

	// how do we handle newly created pages? listen to manifest changes? at least in dev
	files, err := getHTMLFilesFromManifest(manifest)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("[REGISTER_TEMPLATES] files count: %d\n", len(files))

	var template_paths []string
	for _, file := range files {
		uri := "/" + file.Name

		template_paths = append(template_paths, file.Src)

		log.Printf("[REGISTER_TEMPLATES] page name: %s\n", file.Name)
		log.Printf("[REGISTER_TEMPLATES] uri:       %s\n", uri)
		log.Printf("[REGISTER_TEMPLATES] filepath:  %s\n", file.Src)

		if uri == "/home" {
			uri = "/"
			log.Printf("[REGISTER_TEMPLATES] home detected, using uri:  %s\n", uri)
		}

		g.router.GET(uri, func(ctx *gin.Context) {
			log.Printf("[GET /%s]\n", file.Name)

			ctx.HTML(200, file.Name, gin.H{})
		})
	}

	g.router.LoadHTMLFS(http.FS(g.webapp_fs), template_paths...)

}

func (g *AppRouter) registerWebappAssets() {
	g.router.NoRoute(func(ctx *gin.Context) {
		request_path := ctx.Request.URL.Path
		asset_filepath := strings.TrimPrefix(request_path, "/")

		// log.Printf("[NO_ROUTE_HANDLER] request_path: %s\n", request_path)

		if strings.HasPrefix(asset_filepath, "src") {
			// log.Println("[NO_ROUTE_HANDLER] has prefix /src. Skipping")
			// don't serve from /src since the pages are there
			return
		}

		asset_file, err := fs.Stat(g.webapp_fs, asset_filepath)
		if err != nil {
			// log.Printf("[NO_ROUTE_HANDLER] Error stating route as asset file: %s", err.Error())
			return
		}

		// log.Printf("[NO_ROUTE_HANDLER] Checking if file in route is directory: %s", asset_file.Name())

		if asset_file.IsDir() {
			// log.Println("[NO_ROUTE_HANDLER] Is dir, skipping")
			return
		}

		// log.Printf("[NO_ROUTE_HANDLER] serving file at %s", trimmed_request_path)

		ctx.FileFromFS(asset_filepath, http.FS(g.webapp_fs))
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

func getHTMLFilesFromManifest(r io.Reader) ([]PageFileDescriptor, error) {
	var manifest map[string]ManifestEntry
	if err := json.NewDecoder(r).Decode(&manifest); err != nil {
		return nil, err
	}

	var result []PageFileDescriptor

	for _, entry := range manifest {
		log.Printf("[GET_HTML_FILE_FROM_MANIFEST] %#v\n", entry)

		if !entry.IsEntry {
			log.Println("skipped")
			continue
		}

		result = append(result, PageFileDescriptor{
			Name: entry.Name,
			Src:  entry.Src,
		})
	}

	return result, nil
}
