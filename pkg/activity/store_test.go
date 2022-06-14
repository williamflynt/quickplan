package activity

import (
	"fmt"
	"testing"
)

func TestInMemoryGraphStore(t *testing.T) {
	s := NewInMemoryGraphStore()
	g := newTestGraph()
	id, err := s.Save(&g)
	if err != nil {
		t.Fatal("got error saving Graph")
	}
	ptrStr := fmt.Sprintf(`%v`, &g)
	if id != ptrStr {
		t.Fatal("pointer to Graph should be the same for both outputs")
	}
	fromStore, err := s.Load(id)
	if err != nil {
		t.Fatal("could not load Graph")
	}
	if &g != fromStore {
		t.Fatal("expected pointers to match")
	}
	s.Delete(id)
	afterDelete, _ := s.Load(id)
	_, _ = s.Load(id) // Testing no panic.
	if afterDelete != nil {
		t.Fatal("expected nil pointer for deleted graph")
	}
}

func newTestGraph() InMemoryGraph {
	g := NewInMemoryGraph("Basic Example")
	_, _ = g.ActivityAdd(Activity{
		Id:             "START",
		Name:           "Start",
		DurationLow:    0,
		DurationLikely: 0,
		DurationHigh:   0,
	})
	_, _ = g.ActivityAdd(Activity{
		Id:             "A",
		Name:           "Activity A",
		DurationLow:    10,
		DurationLikely: 20,
		DurationHigh:   30,
	})
	_, _ = g.ActivityAdd(Activity{
		Id:             "B",
		Name:           "Activity B",
		DurationLow:    40,
		DurationLikely: 80,
		DurationHigh:   90,
	})
	_, _ = g.ActivityAdd(Activity{
		Id:             "C",
		Name:           "Activity C",
		DurationLow:    20,
		DurationLikely: 30,
		DurationHigh:   40,
	})
	_, _ = g.ActivityAdd(Activity{
		Id:             "D",
		Name:           "Activity D",
		DurationLow:    20,
		DurationLikely: 20,
		DurationHigh:   80,
	})
	_, _ = g.ActivityAdd(Activity{
		Id:             "E",
		Name:           "Activity E",
		DurationLow:    30,
		DurationLikely: 30,
		DurationHigh:   42,
	})
	_, _ = g.ActivityAdd(Activity{
		Id:             "END",
		Name:           "End",
		DurationLow:    0,
		DurationLikely: 0,
		DurationHigh:   0,
	})

	_, _ = g.DependencyAdd("START", "A")
	_, _ = g.DependencyAdd("START", "B")
	_, _ = g.DependencyAdd("A", "C")
	_, _ = g.DependencyAdd("C", "D")
	_, _ = g.DependencyAdd("B", "D")
	_, _ = g.DependencyAdd("B", "E")
	_, _ = g.DependencyAdd("D", "END")
	_, _ = g.DependencyAdd("E", "END")

	return g
}
