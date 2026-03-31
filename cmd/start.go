package cmd

import (
	"my-garden/cmd/watcher"
	"my-garden/internal/database"
	"my-garden/internal/server"

	"log"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
)

func StartApp(db_cfg database.ConnectionConfig, server_cfg server.ServerConfig) {
	if os.Getenv("MY_GARDEN_WATCH") == "1" {
		projectRoot, err := os.Getwd()
		if err != nil {
			log.Fatalf("Error getting working directory: %s", err)
		}

		devBin := filepath.Join(projectRoot, ".my-garden-dev", "my-garden")
		ignore := []string{
			".git",
			"frontend",
			".my-garden-dev",
			"internal/database/databases",
		}

		go watcher.Start(os.DirFS(projectRoot), ".", ignore, func() error {
			log.Printf("change detected; rebuilding...")
			if err := os.MkdirAll(filepath.Dir(devBin), 0o755); err != nil {
				return err
			}

			cmd := exec.Command("go", "build", "-o", devBin, ".")
			cmd.Dir = projectRoot
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			if err := cmd.Run(); err != nil {
				return err
			}

			log.Printf("restarting %s", devBin)
			args := append([]string{devBin}, os.Args[1:]...)
			return syscall.Exec(devBin, args, os.Environ())
		})
	}

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
