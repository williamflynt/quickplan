package server

import (
	"encoding/json"
	"github.com/rs/zerolog/log"
	"net/http"
	"quickplan/examples"
	"quickplan/pkg/activity"
	"quickplan/pkg/cpm"
)

// --- GRAPH HANDLERS ---

func (s *Server) graphList(w http.ResponseWriter, r *http.Request) {
	ids := s.GraphStore.List()
	w.WriteHeader(200)
	b, err := json.Marshal(ids)
	if err != nil {
		log.Error().Err(err).Msg("error marshaling graph ids")
	}
	_, _ = w.Write(b)
}

func (s *Server) graphLoad(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
}

func (s *Server) graphNew(w http.ResponseWriter, r *http.Request) {
	g := activity.NewInMemoryGraph("New Graph")
	if _, err := s.GraphStore.Save(&g); err != nil {
		log.Warn().Err(err).Msg("error saving new Graph to server GraphStore")
	}
	b, err := json.Marshal(&g)
	if err != nil {
		log.Warn().Err(err).Msg("error marshalling new Graph")
	}
	w.WriteHeader(201)
	_, _ = w.Write(b)

}

func (s *Server) graphGet(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
}

func (s *Server) graphDelete(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(204)
}

func (s *Server) graphActivityNew(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(201)
}

func (s *Server) graphActivityPatch(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
}

func (s *Server) graphActivityDelete(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(204)
}

func (s *Server) graphActivityInsertBefore(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(201)
}

func (s *Server) graphActivityInsertAfter(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(201)
}

func (s *Server) graphDependencyNew(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(201)
}

func (s *Server) graphDependencyDelete(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(204)
}

func (s *Server) graphDependencySplit(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(201)
}

func (s *Server) graphExportJson(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
}

func (s *Server) graphExportDot(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
}

// --- SYSTEM HANDLERS ---

func (s *Server) healthcheckHandlerFunc(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
	_, _ = w.Write([]byte("ok"))
}

func (s *Server) exampleChartHandlerFunc(w http.ResponseWriter, r *http.Request) {
	type Example struct {
		cpm.Chart
		Dot string `json:"dot"`
	}
	c, dot := examples.Basic()
	b, err := json.Marshal(c)
	ex := new(Example)
	_ = json.Unmarshal(b, ex)
	ex.Dot = dot
	b, _ = json.Marshal(ex)
	if err != nil {
		w.WriteHeader(500)
		_, _ = w.Write([]byte(err.Error()))
		return
	}
	w.WriteHeader(200)
	_, _ = w.Write(b)
}
