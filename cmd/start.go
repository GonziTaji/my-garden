package cmd

import (
	"my-garden/internal/database"
	"my-garden/internal/server"

	"log"
)

func StartApp(db_cfg database.ConnectionConfig, server_cfg server.ServerConfig) {
	log.Println("----------------------------------------------")
	log.Println("Starting app")

	log.Println("----------------------------------------------")
	log.Println("Opening database with config:")
	log.Printf("%#v", db_cfg)

	if err := database.OpenDatabase(db_cfg); err != nil {
		log.Fatalf("Error opening database: %s", err)
	}

	log.Println("----------------------------------------------")
	log.Println("Starting server with config:")
	log.Printf("%#v", server_cfg)

	if err := server.StartServer(server_cfg); err != nil {
		log.Fatalf("Error starting server: %s", err)
	}
}
