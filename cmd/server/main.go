package main

import (
	"fmt"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"net/http"
	"os"
	"quickplan/internal/config"
	"quickplan/internal/server"
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

	options := config.Configure()

	s := server.New(options)

	log.Info().Int("port", s.Options.Port).Msg("starting server")
	return http.ListenAndServe(fmt.Sprintf(":%d", s.Options.Port), s)
}
