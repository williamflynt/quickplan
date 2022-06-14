package activity

import (
	"fmt"
	"github.com/cockroachdb/errors"
)

// GraphStore describes how we will save, load, and delete Graphs.
type GraphStore interface {
	Save(graph Graph) string
	Load(id string) Graph
	Delete(id string)
}

type InMemoryGraphStore struct {
	storage map[string]Graph
}

func NewInMemoryGraphStore() *InMemoryGraphStore {
	return &InMemoryGraphStore{storage: make(map[string]Graph)}
}

func (s *InMemoryGraphStore) Save(graph Graph) (string, error) {
	if graph == nil {
		return "", errors.New("cannot store Graph with nil pointer")
	}
	id := fmt.Sprintf(`%v`, graph)
	s.storage[id] = graph
	return id, nil
}

func (s *InMemoryGraphStore) Load(id string) Graph {
	g := s.storage[id]
	inMemGraph, ok := g.(*InMemoryGraph)
	if !ok {
		return nil
	}
	return inMemGraph
}

func (s *InMemoryGraphStore) Delete(id string) {
	delete(s.storage, id)
}
