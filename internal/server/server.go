package server

import (
	"io/fs"
	"log"
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
			WebappFolder: "dist",
			StaticFolder: "static",
		},
	}
}

func StartServer(cfg ServerConfig) error {
	root, err := os.OpenRoot(cfg.FrontendRoot)
	fsys := root.FS()

	fs.WalkDir(fsys, ".", func(path string, d fs.DirEntry, err error) error {
		log.Printf("\t%s\n", path)

		return nil
	})

	if err != nil {
		return err
	}

	r := GetNewRouter(cfg.RouterConfig, fsys)

	server := http.Server{
		Addr:              cfg.Addr,
		Handler:           r,
		ReadHeaderTimeout: cfg.ReadHeaderTimeout,
	}

	if err := server.ListenAndServe(); err != nil {
		return err
	}

	return nil
}
