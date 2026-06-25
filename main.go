package main

import (
	"my-garden/cmd"
	"os"
	"slices"
)

func main() {
	if slices.Contains(os.Args, "--watch") {
		cmd.Watch()
	} else {
		cmd.Start()
	}
}
