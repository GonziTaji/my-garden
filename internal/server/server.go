package server

import (
	"embed"
	"fmt"
	"net/http"
	"os"
	"time"

	"my-garden/internal/database"
)

var webappFS embed.FS

type EnvType int

const (
	ENV_PROD EnvType = iota
	ENV_DEV
)

type ServerConfig struct {
	Env        EnvType
	ServerAddr string
}

func DefaultConfig() ServerConfig {
	return ServerConfig{
		Env:        ENV_DEV,
		ServerAddr: ":8080",
	}
}

type Server struct {
}

func StartWebServer(cfg ServerConfig) error {
	db, err := database.GetDatabase()
	if err != nil {
		return fmt.Errorf("get database for server: %w", err)
	}

	r := GetNewRouter(RouterConfig{
		WebappFolder: "frontent/dist",
		DB:           db,
	}, os.DirFS("."))

	// Caso ENV_DEV -> se usa el dev server de vite
	if cfg.Env == ENV_PROD {
		r.StaticFS("*", http.FS(webappFS))
	}

	s := &http.Server{
		Addr:              cfg.ServerAddr,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
	}

	defer s.Close()

	if err := s.ListenAndServe(); err != nil {
		return err
	}

	return nil
}
