package activity

// Activity represents a discrete work item in a project.
type Activity struct {
	Id             string `json:"id"`             // Id is the unique Activity ID. It may not have semantic meaning.
	Name           string `json:"name"`           // Name is the label name for the Activity.
	DurationLow    int    `json:"durationLow"`    // DurationLow is the minimum length to accomplish the Activity in arbitrary units.
	DurationLikely int    `json:"durationLikely"` // DurationLikely is the most likely length to accomplish the Activity in arbitrary units.
	DurationHigh   int    `json:"durationHigh"`   // DurationHigh is the longest length to accomplish the Activity in arbitrary units.
	Duration       int    `json:"duration"`       // Duration is the overall estimated duration (ex: Low + 4*Likely + High / 6 ).
}

// Dependency is an edge between two Activity the represents a dependent relationship.
type Dependency struct {
	Id      string `json:"id"`      // Id is the unique Dependency ID.
	FirstId string `json:"firstId"` // FirstId is the ID of the first Activity (the dependency).
	NextId  string `json:"nextId"`  // NextId is the ID of the downstream activity (depends on first).
}