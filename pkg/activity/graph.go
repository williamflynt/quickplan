package activity

import (
	"fmt"
	"github.com/cockroachdb/errors"
	"strings"
)

// Grapher defines the interface for how we will construct our chart.
type Grapher interface {
	Activities() []Activity                                          // Activities returns all activities in the graph.
	ActivityAdd(activity Activity) (Grapher, error)                  // ActivityAdd adds an Activity to our chart.
	ActivityClone(id string) (Grapher, error)                        // ActivityClone creates a new Activity from the old one, and clones inbound and outbound Dependency entities.
	ActivityInsertAfter(before string) (Grapher, error)              // ActivityInsertAfter inserts an Activity after the referenced ID and reflows Dependencies.
	ActivityInsertBefore(after string) (Grapher, error)              // ActivityInsertBefore inserts an Activity before the referenced ID and reflows Dependencies
	ActivityReplace(activity Activity) (Grapher, error)              // ActivityReplace replaces the given Activity in our chart.
	ActivityRemove(id string) (Grapher, error)                       // ActivityRemove removes an Activity and its inbound and outbound Dependency entities from the chart.
	Dependencies() []Dependency                                      // Dependencies returns all dependencies in the graph.
	DependencyAdd(firstId string, nextId string) (Grapher, error)    // DependencyAdd adds a Dependency between two Activity.
	DependencyRemove(firstId string, nextId string) (Grapher, error) // DependencyRemove clears a Dependency between two Activity.
	DependencySplit(firstId string, nextId string) (Grapher, error)  // DependencySplit adds a new Activity in the middle of a dependency relationship.
}

// InMemoryGraph stores the Activity and Dependency entities in local memory.
type InMemoryGraph struct {
	Name             string                  `json:"name"`             // Name is the display name for the chart.
	ActivityMap      map[string]Activity     `json:"activityMap"`      // ActivityMap stores Activity entities, mapped by Id.
	DependencyFwdMap map[string][]Dependency `json:"dependencyFwdMap"` // DependencyFwdMap stores Dependency entities, indexed by Dependency.FirstId.
}

func (i *InMemoryGraph) Activities() []Activity {
	a := make([]Activity, len(i.ActivityMap))
	for _, activity := range i.ActivityMap {
		a = append(a, activity)
	}
	return a
}

func (i *InMemoryGraph) ActivityAdd(activity Activity) (Grapher, error) {
	if err := i.validateIdNotExists(activity.Id); err != nil {
		return i, err
	}
	i.ActivityMap[activity.Id] = activity
	i.DependencyFwdMap[activity.Id] = make([]Dependency, 0) // Avoid nil error later.
	return i, nil
}

func (i *InMemoryGraph) ActivityClone(id string) (Grapher, error) {
	if err := i.validateIdExists(id); err != nil {
		return i, err
	}

	newId := i.generateNewId(id)
	if _, err := i.activityClone(i.ActivityMap[id], newId); err != nil {
		return i, err
	}

	// Clone outbound dependencies.
	cloneOutDeps := make([]Dependency, len(i.DependencyFwdMap[id]))
	for _, d := range i.DependencyFwdMap[id] {
		cloneOutDeps = append(cloneOutDeps, d)
	}
	i.DependencyFwdMap[newId] = cloneOutDeps

	// Clone inbound dependencies.
	for activityId, deps := range i.DependencyFwdMap {
		for _, d := range deps {
			if d.NextId == id {
				i.DependencyFwdMap[activityId] = append(i.DependencyFwdMap[activityId], Dependency{activityId, newId})
			}
		}
	}

	return i, nil
}

func (i *InMemoryGraph) ActivityInsertAfter(before string) (Grapher, error) {
	if err := i.validateIdExists(before); err != nil {
		return i, err
	}
	newId := i.generateNewId(before)
	_, err := i.ActivityAdd(Activity{Id: newId})
	if err != nil {
		_, _ = i.ActivityRemove(newId)
		return i, err
	}

	i.DependencyFwdMap[newId] = i.DependencyFwdMap[before]
	i.DependencyFwdMap[before] = []Dependency{{before, newId}}
	return i, nil
}

func (i *InMemoryGraph) ActivityInsertBefore(after string) (Grapher, error) {
	if err := i.validateIdExists(after); err != nil {
		return i, err
	}
	newId := i.generateNewId(after)
	_, err := i.ActivityAdd(Activity{Id: newId})
	if err != nil {
		_, _ = i.ActivityRemove(newId)
		return i, err
	}

	i.DependencyFwdMap[newId] = []Dependency{{newId, after}}
	// Point all inbound Dependencies to this new thing.
	for activityId, deps := range i.DependencyFwdMap {
		for idx, d := range deps {
			if d.NextId == after {
				// There should only be a single edge between, so this it's safe to keep this in the if block.
				newDeps := deps
				newDeps[idx] = Dependency{d.FirstId, newId}
				i.DependencyFwdMap[activityId] = newDeps
				break
			}
		}
	}
	return i, nil
}

func (i *InMemoryGraph) ActivityReplace(activity Activity) (Grapher, error) {
	if err := i.validateIdNotBlank(activity.Id); err != nil {
		return i, err
	}
	i.ActivityMap[activity.Id] = activity
	return i, nil
}

func (i *InMemoryGraph) ActivityRemove(id string) (Grapher, error) {
	if _, ok := i.ActivityMap[id]; !ok {
		// Avoid the iteration over dependencies.
		return i, nil
	}
	delete(i.ActivityMap, id)
	delete(i.DependencyFwdMap, id) // Remove the DependencyFwdMap out from this Activity.
	// Remove inbound Dependencies.
	for activityId, deps := range i.DependencyFwdMap {
		for idx, d := range deps {
			if id == d.NextId {
				i.DependencyFwdMap[activityId] = popFromSlice(deps, idx)
				break
			}
		}
	}
	return i, nil
}

func (i *InMemoryGraph) Dependencies() []Dependency {
	allDeps := make([]Dependency, 0)
	for _, deps := range i.DependencyFwdMap {
		for _, d := range deps {
			allDeps = append(allDeps, d)
		}
	}
	return allDeps
}

func (i *InMemoryGraph) DependencyAdd(firstId string, nextId string) (Grapher, error) {
	// No circular dependencies! A PERT chart is a DAG.
	if err := validateIdsNotSame(firstId, nextId); err != nil {
		return i, err
	}

	deps, ok := i.DependencyFwdMap[firstId] // All the Dependency outbound from the first Activity.
	if !ok {
		i.DependencyFwdMap[firstId] = []Dependency{{firstId, nextId}}
		return i, nil
	}
	// Check for existing edge.
	for _, d := range deps {
		if d.NextId == nextId {
			return i, nil
		}
	}
	// Doesn't exist!
	i.DependencyFwdMap[firstId] = append(i.DependencyFwdMap[firstId], Dependency{firstId, nextId})
	return i, nil
}

func (i *InMemoryGraph) DependencyRemove(firstId string, nextId string) (Grapher, error) {
	deps, ok := i.DependencyFwdMap[firstId] // All the Dependency outbound from the first Activity.
	if !ok {
		return i, nil
	}
	for idx, d := range deps {
		if d.NextId == nextId {
			i.DependencyFwdMap[firstId] = popFromSlice(deps, idx)
			return i, nil
		}
	}
	return i, nil
}

func (i *InMemoryGraph) DependencySplit(firstId string, nextId string) (Grapher, error) {
	if err := i.validateIdExists(firstId); err != nil {
		return i, err
	}
	if err := i.validateIdExists(nextId); err != nil {
		return i, err
	}

	newId := i.generateNewId(firstId)
	if _, err := i.ActivityAdd(Activity{Id: newId}); err != nil {
		_, _ = i.ActivityRemove(newId)
		return i, err
	}

	_, _ = i.DependencyRemove(firstId, nextId)
	_, _ = i.DependencyAdd(firstId, newId)
	_, _ = i.DependencyAdd(newId, nextId)

	return i, nil
}

// --- HELPERS ---

func (i *InMemoryGraph) activityClone(a Activity, newId string) (Activity, error) {
	a.Id = newId
	_, err := i.ActivityAdd(a)
	return a, err
}

func (i *InMemoryGraph) generateNewId(id string) string {
	// Find the base ID in case we've already exploded, so that we normalize generated IDs.
	baseId := id
	idComponents := strings.Split(id, "-")
	if len(idComponents) > 1 {
		baseId = strings.Join(idComponents[:len(idComponents)-1], "-")
	}

	// Generate a new ID in numerical sequence.
	iteration := 1
	for {
		newId := fmt.Sprintf(`%s-%v`, baseId, iteration)
		_, ok := i.ActivityMap[newId]
		if !ok {
			return newId
		}
	}
}

func popFromSlice[T any](s []T, idx int) []T {
	s[idx] = s[len(s)-1]
	return s[:len(s)-1]
}

func (i *InMemoryGraph) validateIdNotBlank(id string) error {
	if id == "" {
		err := errors.WithDetail(errors.New("invalid id"), "may not use a blank id")
		return err
	}
	return nil
}

func (i *InMemoryGraph) validateIdExists(id string) error {
	if err := i.validateIdNotBlank(id); err != nil {
		return err
	}
	if _, ok := i.ActivityMap[id]; !ok {
		err := errors.WithDetail(errors.New("invalid id"), fmt.Sprintf("activity with id '%s' does not exist", id))
		return err
	}
	return nil
}

func (i *InMemoryGraph) validateIdNotExists(id string) error {
	if err := i.validateIdNotBlank(id); err != nil {
		return err
	}
	if _, ok := i.ActivityMap[id]; ok {
		err := errors.WithDetail(errors.New("invalid id"), fmt.Sprintf("activity with id '%s' already exists", id))
		return err
	}
	return nil
}

func validateIdsNotSame(a string, b string) error {
	if a == b {
		err := errors.WithDetail(errors.New("invalid ids"), "may not use the same id twice")
		return err
	}
	return nil
}
