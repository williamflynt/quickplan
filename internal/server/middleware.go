package server

import (
	"github.com/rs/zerolog/log"
	"net/http"
)

func OptionsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		if r.Method == http.MethodOptions {
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, HEAD, DELETE, OPTIONS, PUT, PATCH")
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func RequestLoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Debug().
			Str("path", r.URL.Path).
			Str("method", r.Method).
			Str("ip", r.RemoteAddr).
			Msg("http request")
		next.ServeHTTP(w, r)
	})
}
