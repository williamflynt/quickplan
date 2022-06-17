package activity

import (
	"testing"
)

func TestActivity_Duration(t *testing.T) {
	type fields struct {
		Id             string
		Name           string
		DurationLow    int
		DurationLikely int
		DurationHigh   int
	}
	tests := []struct {
		name   string
		fields fields
		want   float64
	}{
		{
			"calculates",
			fields{"abc123", "Test Activity", 1, 3, 10},
			3.8},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			a := Activity{
				Id:             tt.fields.Id,
				Name:           tt.fields.Name,
				DurationLow:    tt.fields.DurationLow,
				DurationLikely: tt.fields.DurationLikely,
				DurationHigh:   tt.fields.DurationHigh,
			}
			// Floats are approximate... Our rounding is to the tenth.
			if got := a.Duration(); got-tt.want > 0.001 {
				t.Errorf("Duration() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_Serialize(t *testing.T) {
	g := newTestGraph()
	data := g.Serialize()

	newG := NewInMemoryGraph()
	if _, err := newG.Deserialize(data); err != nil {
		t.Fatal("expected err to be nil")
	}
	if g.Name != newG.Name {
		t.Fatal("expected names to be the same")
	}
	if len(g.ActivityMap) != len(newG.ActivityMap) {
		t.Fatal("expected identical ActivityMap")
	}
	for _, item := range g.ActivityMap {
		newDeps := newG.ActivityMap[item.Id].DependsOn
		if newDeps == nil {
			t.Fatal("should not have nil slice for DependsOn")
		}
		if len(newDeps) != len(item.DependsOn) {
			t.Fatal("expected DependsOn to be same length")
		}
	}
}
