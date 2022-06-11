package server

import (
	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
)

func (s *Server) routes() chi.Router {
	r := chi.NewRouter()

	// Middleware stack.
	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer)
	r.Use(OptionsMiddleware)

	r.Group(func(r chi.Router) {
		r.Get("/", s.healthcheckHandlerFunc)
		r.Get("/healthcheck", s.healthcheckHandlerFunc)

		r.Route("/api", func(r chi.Router) {
			r.Route("/v1", func(r chi.Router) {
				// REST endpoints for Activity.
				r.Route("/activities", func(r chi.Router) {

					r.Get("/", s.healthcheckHandlerFunc)
					r.Post("/", s.healthcheckHandlerFunc)

					r.Route("/{id}", func(r chi.Router) {
						r.Get("/", s.healthcheckHandlerFunc)
						r.Patch("/", s.healthcheckHandlerFunc)
						r.Delete("/", s.healthcheckHandlerFunc)

						r.Route("/explode", func(r chi.Router) {
							r.Post("/", s.healthcheckHandlerFunc)
						})
					})

				})
				// REST endpoints for graph output.
				r.Route("/graph", func(r chi.Router) {
					r.Get("/", s.healthcheckHandlerFunc)
					r.Get("/example", s.healthcheckHandlerFunc)
				})
			})
		})
	})

	return r
}
