package server

import (
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"quickplan/internal/config"
	"strings"
	"testing"
)

// FuzzServerHealthcheckHandlerFunc is a silly fuzzing test against our healthcheck handler, mostly to demonstrate how
// to create a fuzzing test.
func FuzzServerHealthcheckHandlerFunc(f *testing.F) {
	// Manually make a new Server.
	s := New(config.Options{Port: 3535})
	// Set up fuzzing to provide two strings.
	f.Add("seed")
	// Do the fuzz.
	f.Fuzz(func(t *testing.T, c string) {
		// reader is extra data in the body.
		reader := strings.NewReader(c)

		req := httptest.NewRequest(http.MethodGet, "/", reader)
		w := httptest.NewRecorder()
		s.healthcheckHandlerFunc(w, req)

		// Get the response body.
		res := w.Result()
		defer func(Body io.ReadCloser) {
			err := Body.Close()
			if err != nil {
				t.Log("error reading body")
			}
		}(res.Body)
		data, err := ioutil.ReadAll(res.Body)
		if err != nil {
			t.Errorf("expected error to be nil got %v", err)
		}

		// Test that it's always "ok".
		if string(data) != "ok" {
			t.Errorf("expected ok got %v", string(data))
		}
	})
}
