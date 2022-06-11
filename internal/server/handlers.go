package server

import (
	"encoding/json"
	"net/http"
	"quickplan/examples"
	"quickplan/pkg/cpm"
)

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
