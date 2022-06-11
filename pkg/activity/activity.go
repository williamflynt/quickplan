package activity

import "math"

// Activity represents a discrete work item in a project.
type Activity struct {
	Id             string `json:"id"`             // Id is the unique Activity ID. It may not have semantic meaning.
	Name           string `json:"name"`           // Name is the label name for the Activity.
	DurationLow    int    `json:"durationLow"`    // DurationLow is the minimum length to accomplish the Activity in arbitrary units.
	DurationLikely int    `json:"durationLikely"` // DurationLikely is the most likely length to accomplish the Activity in arbitrary units.
	DurationHigh   int    `json:"durationHigh"`   // DurationHigh is the longest length to accomplish the Activity in arbitrary units.
}

// Duration calculates the estimated duration for an Activity.
func (a Activity) Duration() float64 {
	ans := float64(a.DurationLow+(a.DurationLikely*4)+a.DurationHigh) / 6
	// Round to nearest tenth.
	return math.Round(ans/0.1) * 0.1
}

// Dependency is an edge between two Activity the represents a dependent relationship.
type Dependency struct {
	FirstId string `json:"firstId"` // FirstId is the ID of the first Activity (the dependency).
	NextId  string `json:"nextId"`  // NextId is the ID of the downstream activity (depends on first).
}
