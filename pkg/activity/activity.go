package activity

import (
	"math"
)

// Activity represents a discrete work item in a project. It implements cpm.Task.
type Activity struct {
	Id             string               `json:"id"`             // Id is the unique Activity ID. It may not have semantic meaning.
	Name           string               `json:"name"`           // Name is the human-readable label name for the Activity.
	Descr          string               `json:"description"`    // Descr is a longer-form description of this Activity.
	DurationLow    int                  `json:"durationLow"`    // DurationLow is the minimum length to accomplish the Activity in arbitrary units.
	DurationLikely int                  `json:"durationLikely"` // DurationLikely is the most likely length to accomplish the Activity in arbitrary units.
	DurationHigh   int                  `json:"durationHigh"`   // DurationHigh is the longest length to accomplish the Activity in arbitrary units.
	DependsOn      map[string]*Activity `json:"dependsOn"`      // DependsOn is the list of Activity that must finish before this can start.
}

func (a *Activity) Uid() string {
	return a.Id
}

func (a *Activity) Title() string {
	return a.Name
}

func (a *Activity) Description() string {
	return a.Descr
}

func (a *Activity) Meta() map[string]string {
	return make(map[string]string)
}

// Duration calculates the estimated duration for an Activity.
func (a *Activity) Duration() float64 {
	// TODO: Update duration tracking to understand "set" vs. "not set". (wf 6 Jul 22)
	if (a.DurationLow > 0 || a.DurationLikely > 0 || a.DurationHigh > 0) &&
		!(a.DurationLikely > 0 && a.DurationHigh > 0) {
		// They set something, but not the other things. Just do the average of "things that are set".
		// Don't check DurationLow in the && clause because it might legit be zero.
		setCount := 1 // We will always count the low value (even if it's zero).
		sum := 0
		for _, v := range []int{a.DurationLikely, a.DurationHigh} {
			if v > 0 {
				sum += v
				setCount += 1
			}
		}
		sum += a.DurationLow
		return tenthRound(float64(sum) / float64(setCount))
	}
	// The standard CPM duration figure.
	ans := float64(a.DurationLow+(a.DurationLikely*4)+a.DurationHigh) / 6
	// Round to nearest tenth.
	return tenthRound(ans)
}

// DurationL is the low estimated duration for an Activity.
func (a *Activity) DurationL() int {
	return a.DurationLow
}

// DurationM is the likely estimated duration for an Activity.
func (a *Activity) DurationM() int {
	return a.DurationLikely
}

// DurationH is the high estimated duration for an Activity.
func (a *Activity) DurationH() int {
	return a.DurationHigh
}

func (a *Activity) Predecessors() []string {
	ado := make([]string, 0)
	for _, v := range a.DependsOn {
		if v != nil {
			ado = append(ado, v.Id)
		}
	}
	return ado
}

// Dependency is an edge between two Activity the represents a dependent relationship.
type Dependency struct {
	FirstId string `json:"firstId"` // FirstId is the ID of the first Activity (the dependency).
	NextId  string `json:"nextId"`  // NextId is the ID of the downstream activity (depends on first).
}

// --- HELPERS ---

func tenthRound(f float64) float64 {
	ratio := math.Pow(10, float64(1))
	return math.Round(f*ratio) / ratio
}
