package activity

import (
	"encoding/json"
	"fmt"
	"github.com/cockroachdb/errors"
	"strings"
)

// Graph defines the interface for how we will construct our chart.
type Graph interface {
	Activities() []Activity                                        // Activities returns all activities in the graph.
	ActivityAdd(activity Activity) (Graph, error)                  // ActivityAdd adds an Activity to our chart.
	ActivityClone(id string) (Graph, error)                        // ActivityClone creates a new Activity from the old one, and clones inbound and outbound Dependency entities.
	ActivityInsertAfter(before string) (Graph, error)              // ActivityInsertAfter inserts an Activity after the referenced ID and reflows Dependencies.
	ActivityInsertBefore(after string) (Graph, error)              // ActivityInsertBefore inserts an Activity before the referenced ID and reflows Dependencies
	ActivityPatch(id string, attrs map[string]any) (Graph, error)  // ActivityPatch updates the given Activity with the provided attributes.
	ActivityReplace(activity Activity) (Graph, error)              // ActivityReplace replaces the given Activity in our chart.
	ActivityRemove(id string) (Graph, error)                       // ActivityRemove removes an Activity and its inbound and outbound Dependency entities from the chart.
	Dependencies() []Dependency                                    // Dependencies returns all dependencies in the graph.
	DependencyAdd(firstId string, nextId string) (Graph, error)    // DependencyAdd adds a Dependency between two Activity.
	DependencyRemove(firstId string, nextId string) (Graph, error) // DependencyRemove clears a Dependency between two Activity.
	DependencySplit(firstId string, nextId string) (Graph, error)  // DependencySplit adds a new Activity in the middle of a dependency relationship.
}

// InMemoryGraph stores the Activity and Dependency entities in local memory.
type InMemoryGraph struct {
	Name        string               `json:"name"`        // Name is the display name for the chart.
	ActivityMap map[string]*Activity `json:"activityMap"` // ActivityMap stores Activity entities, mapped by Id.
}

func NewInMemoryGraph(title string) InMemoryGraph {
	return InMemoryGraph{
		Name:        title,
		ActivityMap: make(map[string]*Activity),
	}
}

func (i *InMemoryGraph) Activities() []Activity {
	a := make([]Activity, 0)
	for idx, activity := range i.ActivityMap {
		if activity != nil {
			a = append(a, *i.ActivityMap[idx])
		}
	}
	return a
}

func (i *InMemoryGraph) ActivityAdd(activity Activity) (Graph, error) {
	if err := i.validateIdNotExists(activity.Id); err != nil {
		return i, err
	}
	activity.dependsOn = make(map[string]*Activity, 0)
	i.ActivityMap[activity.Id] = &activity
	return i, nil
}

func (i *InMemoryGraph) ActivityClone(id string) (Graph, error) {
	if err := i.validateIdExists(id); err != nil {
		return i, err
	}

	newId := i.generateNewId(id)
	if _, err := i.activityClone(*i.ActivityMap[id], newId); err != nil {
		return i, err
	}

	// Clone dependencies.
	for k, v := range i.ActivityMap[id].dependsOn {
		i.ActivityMap[newId].dependsOn[k] = v
	}

	return i, nil
}

func (i *InMemoryGraph) ActivityInsertAfter(existingId string) (Graph, error) {
	if err := i.validateIdExists(existingId); err != nil {
		return i, err
	}
	newId := i.generateNewId(existingId)
	_, err := i.ActivityAdd(Activity{Id: newId})
	if err != nil {
		_, _ = i.ActivityRemove(newId)
		return i, err
	}

	// Add existing to the dependsOn for the new Activity.
	i.ActivityMap[newId].dependsOn[existingId] = i.ActivityMap[existingId]
	return i, nil
}

func (i *InMemoryGraph) ActivityInsertBefore(existingId string) (Graph, error) {
	if err := i.validateIdExists(existingId); err != nil {
		return i, err
	}
	newId := i.generateNewId(existingId)
	_, err := i.ActivityAdd(Activity{Id: newId})
	if err != nil {
		_, _ = i.ActivityRemove(newId)
		return i, err
	}

	// Point all inbound Dependencies from the existing Activity to this new Activity.
	for id, p := range i.ActivityMap[existingId].dependsOn {
		if p != nil {
			i.ActivityMap[newId].dependsOn[id] = p
		}
	}
	// Update the existing Activity to only rely on the new one.
	i.ActivityMap[existingId].dependsOn = map[string]*Activity{newId: i.ActivityMap[newId]}

	return i, nil
}

func (i *InMemoryGraph) ActivityPatch(id string, attrs map[string]any) (Graph, error) {
	// Natural protection against ID mutation.
	if err := i.validateIdExists(id); err != nil {
		return i, err
	}
	j, err := json.Marshal(attrs)
	if err != nil {
		return i, err
	}
	err = json.Unmarshal(j, i.ActivityMap[id])
	return i, err
}

func (i *InMemoryGraph) ActivityReplace(activity Activity) (Graph, error) {
	if err := i.validateIdNotBlank(activity.Id); err != nil {
		return i, err
	}
	i.ActivityMap[activity.Id] = &activity
	return i, nil
}

func (i *InMemoryGraph) ActivityRemove(id string) (Graph, error) {
	delete(i.ActivityMap, id)
	// Remove related Dependencies.
	for _, a := range i.ActivityMap {
		delete(a.dependsOn, id)
	}
	return i, nil
}

func (i *InMemoryGraph) Dependencies() []Dependency {
	allDeps := make([]Dependency, 0)
	for _, a := range i.ActivityMap {
		for _, d := range a.dependsOn {
			allDeps = append(allDeps, Dependency{
				FirstId: d.Id,
				NextId:  a.Id,
			})
		}
	}
	return allDeps
}

func (i *InMemoryGraph) DependencyAdd(firstId string, nextId string) (Graph, error) {
	// No circular dependencies! A PERT chart is a DAG.
	if err := validateIdsNotSame(firstId, nextId); err != nil {
		return i, err
	}
	if err := i.validateIdExists(firstId); err != nil {
		return i, err
	}
	if err := i.validateIdExists(nextId); err != nil {
		return i, err
	}

	i.ActivityMap[nextId].dependsOn[firstId] = i.ActivityMap[firstId]

	return i, nil
}

func (i *InMemoryGraph) DependencyRemove(firstId string, nextId string) (Graph, error) {
	if err := i.validateIdExists(nextId); err != nil {
		return i, err
	}
	delete(i.ActivityMap[nextId].dependsOn, firstId)
	return i, nil
}

func (i *InMemoryGraph) DependencySplit(firstId string, nextId string) (Graph, error) {
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
	if p, ok := i.ActivityMap[id]; !ok || p == nil {
		err := errors.WithDetail(errors.New("invalid id"), fmt.Sprintf("activity with id '%s' does not exist", id))
		return err
	}
	return nil
}

func (i *InMemoryGraph) validateIdNotExists(id string) error {
	if err := i.validateIdNotBlank(id); err != nil {
		return err
	}
	if p, ok := i.ActivityMap[id]; ok && p != nil {
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
