package server

import (
	"context"
	"errors"
	"net/http"
	"os"
	"time"
)

type ServerConfig struct {
	Addr         string
	FrontendRoot string

	// timeout due CWE-400 - Potential Slowloris Attack
	ReadHeaderTimeout time.Duration

	RouterConfig
}

func DefaultConfig() ServerConfig {
	return ServerConfig{
		Addr:              ":8080",
		FrontendRoot:      "frontend",
		ReadHeaderTimeout: 5 * time.Second,

		RouterConfig: RouterConfig{
			WebappFolder:  "dist",
			StaticFolder:  "public",
			SsrScriptPath: "ssr/render-ssr.mjs",
		},
	}
}

// Server holds the HTTP server plus any resources that must stay alive
// while it is serving (e.g. an os.Root used to build an fs.FS).
type Server struct {
	HTTP *http.Server
	root *os.Root
}

func NewWebServer(cfg ServerConfig) (*Server, error) {
	root, err := os.OpenRoot(cfg.FrontendRoot)
	if err != nil {
		return nil, err
	}

	fsys := root.FS()
	cfg.RouterConfig.FrontendRoot = cfg.FrontendRoot
	r := GetNewRouter(cfg.RouterConfig, fsys)

	httpSrv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           r,
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
	}

	return &Server{HTTP: httpSrv, root: root}, nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	// Close the root after the HTTP server is done using it.
	err := s.HTTP.Shutdown(ctx)
	closeErr := s.root.Close()
	if err != nil {
		return err
	}
	return closeErr
}

func StartServer(cfg ServerConfig) error {
	s, err := NewWebServer(cfg)
	if err != nil {
		return err
	}

	err = s.HTTP.ListenAndServe()
	if errors.Is(err, http.ErrServerClosed) {
		// If the caller never called Shutdown, make sure we still free the root.
		return s.root.Close()
	}

	if err != nil {
		_ = s.root.Close()
		return err
	}

	return s.root.Close()
}
