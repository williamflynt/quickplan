package config

import (
	"embed"
	"fmt"
	"github.com/knadh/koanf"
	"github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/rawbytes"
	"github.com/rs/zerolog/log"
	"os"
)

//go:embed configs
var appEnvFiles embed.FS

type AppEnvValue string

const (
	Production AppEnvValue = "production"
	Staging    AppEnvValue = "staging"
	Local      AppEnvValue = "local"
)

type Options struct {
	ApplicationEnvironment AppEnvValue `koanf:"application_environment"` // ApplicationEnvironment may be set in the OS environment, otherwise default to "local".
	Port                   int         `koanf:"port"`                    // Port is the port the server will run on.
}

var k = koanf.New(".")

// Configure sets up the projects options.
func Configure() Options {
	appEnv := os.Getenv("APPLICATION_ENVIRONMENT")
	if appEnv == "" {
		appEnv = string(Local)
	}
	options := Options{ApplicationEnvironment: AppEnvValue(appEnv)}

	embeddedFile := appEnvFile(appEnv)
	log.Info().Str("filepath", embeddedFile).Msg("loading config file")
	b, err := appEnvFiles.ReadFile(embeddedFile)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load config file")
	}

	if err := k.Load(rawbytes.Provider(b), yaml.Parser()); err != nil {
		log.Fatal().Err(err).Msg("failed to load config bytestring")
	}
	err = k.Unmarshal("", &options)
	if err != nil {
		log.Error().Err(err).Msg("error while unmarshalling options")
	}

	return options
}

// appEnvFile returns the name of the appropriate `.yml` file, which depends on the  correlated to the application
// environment setting in `Options.AppEnvironment`.
func appEnvFile(appEnv string) string {
	if appEnv == "" {
		appEnv = "local"
	}
	return fmt.Sprintf(`configs/%s/env.yml`, appEnv) // Example: `configs/production/env.yml`
}
