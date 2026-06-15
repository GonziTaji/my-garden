package main

import (
	"log"
	"os"

	"my-garden/internal/database"
	"my-garden/internal/server"
)

func main() {
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

	log.Println("Starting web server...")
	if err := server.StartWebServer(srvCfg); err != nil {
		log.Fatalf("Error starting web server: %s", err)
	}
}
