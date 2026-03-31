package watcher

import (
	"io/fs"
	"log"
	"path/filepath"
	"slices"
	"time"

	"github.com/fsnotify/fsnotify"
)

type WatchCallback func() error

// Based on:
// https://github.com/fsnotify/fsnotify/blob/main/cmd/fsnotify/dedup.go
func Start(fsys fs.FS, root string, ignore_list []string, callback WatchCallback) {
	// Create a new watcher.
	w, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatalf("creating a new watcher: %s", err)
	}
	defer w.Close()

	// Start listening for events.
	go watchLoop(w, callback)

	paths, err := findDirsWithExt(fsys, root, []string{".go"}, ignore_list)

	if err != nil {
		log.Fatalf("finding dirs to watch: %s", err)
	}

	// Add all paths to watch
	for _, p := range paths {
		err = w.Add(p)
		if err != nil {
			log.Fatalf("%q: %s", p, err)
		}
	}

	log.Print("ready; press ^C to exit")

	<-make(chan struct{}) // Block forever
}

func watchLoop(w *fsnotify.Watcher, callback WatchCallback) {
	// Wait 100ms for new events; each new event resets the timer.
	const waitFor = 100 * time.Millisecond

	// Serialize callback execution (typical dev-server semantics).
	triggerCh := make(chan struct{}, 1)
	defer close(triggerCh)
	go func() {
		for range triggerCh {
			func() {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("watcher callback panicked: %v", r)
					}
				}()

				if err := callback(); err != nil {
					log.Printf("watcher callback error: %v", err)
				}
			}()
		}
	}()

	debounceTimer := time.NewTimer(time.Hour)
	if !debounceTimer.Stop() {
		select {
		case <-debounceTimer.C:
		default:
		}
	}

	var debounceC <-chan time.Time // nil when inactive
	resetDebounce := func() {
		if debounceC != nil {
			if !debounceTimer.Stop() {
				select {
				case <-debounceTimer.C:
				default:
				}
			}
		}
		debounceTimer.Reset(waitFor)
		debounceC = debounceTimer.C
	}

	for {
		select {
		// Read from Errors.
		case err, ok := <-w.Errors:
			if !ok { // Channel was closed (i.e. Watcher.Close() was called).
				return
			}
			log.Printf("ERROR: %s", err)

		// Read from Events.
		case e, ok := <-w.Events:
			if !ok { // Channel was closed (i.e. Watcher.Close() was called).
				return
			}

			// We just want to watch for file creation, so ignore everything
			// outside of Create and Write.
			if !e.Has(fsnotify.Create) && !e.Has(fsnotify.Write) {
				continue
			}
			resetDebounce()

		case <-debounceC:
			// Collapse bursts of events into at most one queued callback run.
			select {
			case triggerCh <- struct{}{}:
			default:
			}
			debounceC = nil
		}
	}
}

// Recursively finds all directories containing a file with the given extension.
func findDirsWithExt(fsys fs.FS, root string, exts []string, ignore_list []string) ([]string, error) {
	dirsWithExt := make([]string, 0, 32)
	foundDirs := make(map[string]struct{})

	err := fs.WalkDir(fsys, root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			// Log the error but continue the walk
			log.Printf("Error accessing path %s: %v\n", path, err)
			return nil
		}

		if slices.Contains(ignore_list, path) {
			if d.IsDir() {
				return fs.SkipDir
			}
			return nil
		}

		// Check if it's a file and has the correct extension
		if !d.IsDir() && slices.Contains(exts, filepath.Ext(d.Name())) {
			dirPath := filepath.Dir(path)
			if _, ok := foundDirs[dirPath]; !ok {
				foundDirs[dirPath] = struct{}{}
				dirsWithExt = append(dirsWithExt, dirPath)
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return dirsWithExt, nil
}
