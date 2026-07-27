package cmd

import (
	"context"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"slices"
	"syscall"
	"time"

	"github.com/fsnotify/fsnotify"
)

func runMain(ctx context.Context) {
	log.Println("executing!")

	runCmd := exec.CommandContext(ctx, "go", "run", ".")
	runCmd.Cancel = func() error {
		if runCmd.Process == nil {
			return nil
		}
		return runCmd.Process.Signal(syscall.SIGINT)
	}

	runCmd.Stdout = os.Stdout
	runCmd.Stderr = os.Stderr

	if err := runCmd.Start(); err != nil {
		log.Printf("Failed to start command: %v\n", err)
		return
	}

	if err := runCmd.Wait(); err != nil {
		if ctx.Err() == context.Canceled {
			log.Println("Command was killed due to a file change.")
			return
		}
		log.Printf("Command exited with error: %v\n", err)
	} else {
		log.Println("Command finished successfully.")
	}
}

func Watch() {
	// 1. Create a new watcher instance
	watcher, err := fsnotify.NewWatcher()

	ctx, cancel := context.WithCancel(context.Background())

	if err != nil {
		log.Fatal(err)
	}

	defer watcher.Close()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt)

	done := make(chan struct{})
	go func() {
		<-sigCh
		log.Println("Shutting down...")
		cancel()
		close(done)
	}()

	restartCh := make(chan struct{}, 1)

	go func() {
		var currentCancel context.CancelFunc
		var processDone chan struct{}

		startProcess := func() {
			pCtx, pCancel := context.WithCancel(ctx)
			currentCancel = pCancel
			processDone = make(chan struct{})
			go func() {
				runMain(pCtx)
				close(processDone)
			}()
		}

		startProcess()

		for {
			select {
			case <-restartCh:
				currentCancel()
				<-processDone

				select {
				case <-done:
					return
				default:
				}

				startProcess()
			case <-done:
				return
			}
		}
	}()

	var delayTimer *time.Timer
	const debounceDuration = 500 * time.Millisecond

	// 2. Start a background goroutine to handle incoming events
	go func() {
		for {
			select {
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}

				log.Printf("new event: %v\n", event)

				if !event.Has(fsnotify.Write) && !event.Has(fsnotify.Create) && !event.Has(fsnotify.Remove) {
					continue
				}

				log.Printf("File change detected: %s (%s)\n", event.Name, event.Op)

				if delayTimer != nil {
					delayTimer.Stop()
				}

				delayTimer = time.AfterFunc(debounceDuration, func() {
					log.Println("Debounce finished. Restarting process...")

					select {
					case restartCh <- struct{}{}:
					default:
					}
				})

			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Println("Watcher error encountered:", err)
			}
		}
	}()

	excludedDirs := []string{"databases"}

	for _, dir := range []string{"./internal", "./cmd"} {
		if err := filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if d.IsDir() && !slices.Contains(excludedDirs, d.Name()) {
				return watcher.Add(path)
			}
			return nil
		}); err != nil {
			log.Fatal(err)
		}
	}

	<-done
}
