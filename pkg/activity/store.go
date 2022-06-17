package activity

import (
	"fmt"
	"github.com/cockroachdb/errors"
	"github.com/rs/zerolog/log"
	"io/ioutil"
	"os"
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
	store := &InMemoryGraphStore{storage: make(map[string]Graph)}
	existingGraphData := readTmpGraphFile()
	if len(existingGraphData) > 0 {
		log.Info().Msg("loading most recent Graph from tmp file")
		g := NewInMemoryGraph("")
		if _, err := g.Deserialize(existingGraphData); err != nil {
			log.Error().Err(err).Msg("failed to deserialize tmp data to Graph")
			return store
		}
		store.storage[g.Id] = &g
	}
	return store
}

// Save adds the Graph to the store, but also saves the Chart JSON to `/tmp/<id>.graph` as a backup measure.
func (s *InMemoryGraphStore) Save(graph Graph) (string, error) {
	if graph == nil {
		return "", errors.New("cannot store Graph with nil pointer")
	}
	id := graph.Uid()
	if id == "" {
		id = fmt.Sprintf(`%v`, graph)
	}
	s.storage[id] = graph
	b := graph.Serialize()
	_ = writeTmpGraphFile(b, "")    // Save to the default tmp file.
	err := writeTmpGraphFile(b, id) // Save to a dedicated tmp file.
	log.Debug().Msgf(`saved Graph with id %s`, id)
	return id, err
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

// --- HELPERS ---

func graphFilePath(id string) string {
	if id == "" {
		return `/tmp/quickplan.tmp.graph`
	}
	return fmt.Sprintf(`/tmp/quickplan.%s.tmp.graph`, id)
}

func readTmpGraphFile() []byte {
	path := graphFilePath("")
	content, err := ioutil.ReadFile(path)
	if err != nil {
		log.Error().Err(err).Msg("could not read tmp graph file")
		return []byte{}
	}
	return content
}

func writeTmpGraphFile(data []byte, id string) error {
	path := graphFilePath(id)
	file, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		return err
	}
	defer func(file *os.File) {
		err := file.Close()
		if err != nil {
			log.Error().Err(err).Msg("failed to close file")
		}
	}(file)
	if _, err := file.Write(data); err != nil {
		log.Error().Err(err).Msg("failed to write to file")
		return err
	}
	return nil
}
