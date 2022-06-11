package server

import "net/http"

func (s *Server) healthcheckHandlerFunc(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
	_, _ = w.Write([]byte("ok"))
}
