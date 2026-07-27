package cmd

import (
	"context"
	"log"
	"my-garden/internal/database"
	"my-garden/internal/server"
	"os"
	"os/signal"
	"syscall"
)

func Start() {
	env := os.Getenv("MY_GARDEN_ENV")
	if env == "" {
		env = "dev"
	}

	serverAddr := os.Getenv("MY_GARDEN_ADDR")
	if serverAddr == "" {
		serverAddr = ":8080"
	}

	dbPath := os.Getenv("MY_GARDEN_DB")
	if dbPath == "" {
		dbPath = "internal/database/databases/main.db"
	}

	frontendFolder := os.Getenv("MY_GARDEN_FRONTEND_FOLDER")
	if frontendFolder == "" {
		frontendFolder = "frontend/dist"
	}

	sessionSecret := os.Getenv("MY_GARDEN_SESSION_SECRET")
	if sessionSecret == "" {
		log.Fatal("MY_GARDEN_SESSION_SECRET environment variable is required")
	}

	origin := os.Getenv("MY_GARDEN_ORIGIN")
	if origin == "" && env == "prod" {
		log.Fatal("MY_GARDEN_ORIGIN environment variable is required in production")
	}

	smtpHost := os.Getenv("MY_GARDEN_SMTP_HOST")
	smtpPort := os.Getenv("MY_GARDEN_SMTP_PORT")
	smtpUser := os.Getenv("MY_GARDEN_SMTP_USER")
	smtpPass := os.Getenv("MY_GARDEN_SMTP_PASS")
	smtpFrom := os.Getenv("MY_GARDEN_SMTP_FROM")

	var envType server.EnvType
	if env == "prod" {
		envType = server.ENV_PROD
	} else {
		envType = server.ENV_DEV
	}

	dbCfg := database.ConnectionConfig{DBName: dbPath}
	srvCfg := server.ServerConfig{
		Env:            envType,
		ServerAddr:     serverAddr,
		FrontendFolder: frontendFolder,
		SessionSecret:  sessionSecret,
		SMTPHost:       smtpHost,
		SMTPPort:       smtpPort,
		SMTPUser:       smtpUser,
		SMTPPass:       smtpPass,
		SMTPFrom:       smtpFrom,
	}

	log.Println("----------------------------------------------")
	log.Println("Starting app")
	log.Printf("Environment: %s", env)
	log.Printf("Server addr: %s", serverAddr)
	log.Printf("Database path: %s", dbPath)
	log.Printf("Frontend folder: %s", frontendFolder)

	log.Println("----------------------------------------------")
	log.Println("Opening database...")

	if err := database.OpenDatabase(dbCfg); err != nil {
		log.Fatalf("Error opening database: %s", err)
	}

	log.Println("Applying schema migrations...")
	if err := database.ApplyMigrations(); err != nil {
		log.Fatalf("Error applying schema: %s", err)
	}

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	log.Println("Starting web server...")
	if err := server.StartWebServer(ctx, srvCfg); err != nil {
		log.Fatalf("Error starting web server: %s", err)
	}
}
