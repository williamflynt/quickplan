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
				// REST endpoints for graph storage, interaction, and output.
				r.Route("/graph", func(r chi.Router) {
					r.Get("/", s.graphList)
					r.Get("/example", s.exampleChartHandlerFunc)
					r.Post("/load", s.graphLoad)
					r.Get("/new", s.graphNew)

					r.Route("/{id}", func(r chi.Router) {
						r.Get("/", s.graphGet)
						r.Delete("/", s.graphDelete)
						r.Post("/name/{name}", s.graphSetName)

						// REST endpoints for Activity.
						r.Route("/activities", func(r chi.Router) {
							r.Post("/", s.graphActivityNew)
							r.Route("/{activityId}", func(r chi.Router) {
								r.Patch("/", s.graphActivityPatch)
								r.Delete("/", s.graphActivityDelete)
								r.Route("/explode", func(r chi.Router) {
									r.Post("/", s.healthcheckHandlerFunc)
								})
								r.Post("/insert/before", s.graphActivityInsertBefore)
								r.Post("/insert/after", s.graphActivityInsertAfter)
							})
						})

						// REST endpoints for Dependency.
						r.Route("/dependencies", func(r chi.Router) {
							r.Post("/add", s.graphDependencyNew)
							r.Route("/{depId}", func(r chi.Router) {
								r.Delete("/", s.graphDependencyDelete)
								r.Post("/split", s.graphDependencySplit)
							})
						})

						// REST endpoints for exports.
						r.Route("/exports", func(r chi.Router) {
							r.Get("/dot", s.graphExportDot)
							r.Get("/json", s.graphExportJson)
						})
					})
				})
			})
		})
	})

	return r
}
