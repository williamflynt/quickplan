package activity

import (
	"fmt"
	"github.com/cockroachdb/errors"
	"github.com/rs/zerolog/log"
)

// GraphStore describes how we will save, load, and delete Graphs.
type GraphStore interface {
	Save(graph Graph) (string, error)
	List() []string
	Load(id string) (Graph, error)
	Delete(id string)
}

// InMemoryGraphStore is an incredibly naive implementation of storing a Graph.
// It only supports InMemoryGraphStore.
type InMemoryGraphStore struct {
	storage map[string]Graph
}

func NewInMemoryGraphStore() *InMemoryGraphStore {
	log.Warn().Msg("using InMemoryGraphStore - only InMemoryGraph is supported on Load")
	return &InMemoryGraphStore{storage: make(map[string]Graph)}
}

// Save adds the Graph to the store, but also saves the Chart JSON to `/tmp/<id>.json` as a backup measure.
func (s *InMemoryGraphStore) Save(graph Graph) (string, error) {
	if graph == nil {
		return "", errors.New("cannot store Graph with nil pointer")
	}
	id := graph.Uid()
	if id == "" {
		id = fmt.Sprintf(`%v`, graph)
	}
	s.storage[id] = graph
	return id, nil
}

func (s *InMemoryGraphStore) List() []string {
	savedIds := make([]string, 0)
	for k := range s.storage {
		savedIds = append(savedIds, k)
	}
	return savedIds
}

func (s *InMemoryGraphStore) Load(id string) (Graph, error) {
	g := s.storage[id]
	inMemGraph, ok := g.(*InMemoryGraph)
	if !ok {
		return nil, errors.New("the InMemoryGraphStore storage only supports InMemoryGraph")
	}
	return inMemGraph, nil
}

func (s *InMemoryGraphStore) Delete(id string) {
	delete(s.storage, id)
}
