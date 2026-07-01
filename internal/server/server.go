package server

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"my-garden/internal/database"
)

type EnvType int

const (
	ENV_PROD EnvType = iota
	ENV_DEV
)

type ServerConfig struct {
	Env            EnvType
	ServerAddr     string
	FrontendFolder string
	SessionSecret  string
	SMTPHost       string
	SMTPPort       string
	SMTPUser       string
	SMTPPass       string
	SMTPFrom       string
}

func StartWebServer(cfg ServerConfig) error {
	db, err := database.GetDatabase()
	if err != nil {
		return fmt.Errorf("get database for server: %w", err)
	}

	r := GetNewRouter(RouterConfig{
		WebappFolder:  cfg.FrontendFolder,
		DB:            db,
		Env:           cfg.Env,
		SessionSecret: cfg.SessionSecret,
		SMTPHost:      cfg.SMTPHost,
		SMTPPort:      cfg.SMTPPort,
		SMTPUser:      cfg.SMTPUser,
		SMTPPass:      cfg.SMTPPass,
		SMTPFrom:      cfg.SMTPFrom,
	}, os.DirFS("."))

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
