package main

import (
	"log"
	"my-garden/cmd"
	"my-garden/internal/database"
	"my-garden/internal/server"
)

func main() {
	// Read env, etc.
	log.Printf("Hello world!")

	cmd.StartApp(
		database.DefaultConfig(),
		server.DefaultConfig(),
	)
}
