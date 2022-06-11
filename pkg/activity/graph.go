package activity

// Grapher defines the interface for how we will construct our chart.
type Grapher interface {
	ActivityAdd(activity Activity) (Grapher, error)                  // ActivityAdd adds an Activity to our chart.
	ActivityExplode(id string) (Grapher, error)                      // ActivityExplode creates a new Activity from the old one, and clones inbound and outbound Dependency entities.
	ActivityRemove(id string) (Grapher, error)                       // ActivityRemove removes an Activity and its inbound and outbound Dependency entities from the chart.
	DependencyAdd(firstId string, nextId string) (Grapher, error)    // DependencyAdd adds a Dependency between two Activity.
	DependencyRemove(firstId string, nextId string) (Grapher, error) // DependencyRemove clears a Dependency between two Activity.
}

// InMemoryGraph stores the Activity and Dependency entities in local memory.
type InMemoryGraph struct {
	Name         string                `json:"name"`         // Name is the display name for the chart.
	Activities   map[string]Activity   `json:"activities"`   // Activities stores Activity entities.
	Dependencies map[string]Dependency `json:"dependencies"` // Dependencies stores Dependency entities.
}

func (i *InMemoryGraph) ActivityAdd(activity Activity) (Grapher, error) {
	//TODO implement me
	panic("implement me")
}

func (i *InMemoryGraph) ActivityExplode(id string) (Grapher, error) {
	//TODO implement me
	panic("implement me")
}

func (i *InMemoryGraph) ActivityRemove(id string) (Grapher, error) {
	//TODO implement me
	panic("implement me")
}

func (i *InMemoryGraph) DependencyAdd(firstId string, nextId string) (Grapher, error) {
	//TODO implement me
	panic("implement me")
}

func (i *InMemoryGraph) DependencyRemove(firstId string, nextId string) (Grapher, error) {
	//TODO implement me
	panic("implement me")
}
