package main

import (
	"log"
	"my-garden/internal/database"
	"my-garden/internal/server"
)

func main() {
	// Read env, etc.
	log.Printf("Hello world!")

	log.Println("----------------------------------------------")
	log.Println("Starting app")

	log.Println("----------------------------------------------")
	log.Println("Opening database with config:")
	log.Printf("%#v", database.DefaultConfig())

	if err := database.OpenDatabase(database.DefaultConfig()); err != nil {
		log.Fatalf("Error opening database: %s", err)
	}

	log.Println("Applying schema migrations...")
	if err := database.ApplyMigrations(); err != nil {
		log.Fatalf("Error applying schema: %s", err)
	}

	log.Println("Starting web server with config:")
	log.Printf("%#v", server.DefaultConfig())

	if err := server.StartWebServer(server.DefaultConfig()); err != nil {
		log.Fatalf("Error starting web server: %s", err)
	}
}
