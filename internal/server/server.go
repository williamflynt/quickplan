package server

import (
	"embed"
	"github.com/go-chi/chi"
	"net/http"
	"quickplan/internal/config"
	"quickplan/pkg/activity"
)

//go:embed web
var webFs embed.FS

type Server struct {
	GraphStore activity.GraphStore
	Options    config.Options

	router chi.Router
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.router.ServeHTTP(w, r)
}

func New(options config.Options) *Server {
	s := Server{GraphStore: activity.NewInMemoryGraphStore(), Options: options}
	s.router = s.routes()
	return &s
}
