package main

import (
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"os"
)

func main() {
	if err := run(); err != nil {
		log.Error().Err(err).Msg("exiting with error")
		os.Exit(1)
	}
	os.Exit(0)
}

func run() error {
	// UNIX Time is faster and smaller than most timestamps
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	log.Print("hello world")
	return nil
}
