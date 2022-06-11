package server

import (
	"encoding/json"
	"net/http"
	"quickplan/examples"
)

func (s *Server) healthcheckHandlerFunc(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
	_, _ = w.Write([]byte("ok"))
}

func (s *Server) exampleChartHandlerFunc(w http.ResponseWriter, r *http.Request) {
	c := examples.Basic()
	b, err := json.Marshal(c)
	if err != nil {
		w.WriteHeader(500)
		_, _ = w.Write([]byte(err.Error()))
		return
	}
	w.WriteHeader(200)
	_, _ = w.Write(b)
}
