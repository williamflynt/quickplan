package activity

import (
	"encoding/json"
	"fmt"
	"github.com/cockroachdb/errors"
	"github.com/rs/zerolog/log"
	"strings"
	"time"
)

// Graph defines the interface for how we will construct our chart.
type Graph interface {
	Uid() string                         // Uid returns the unique ID for this Graph.
	Label() string                       // Label returns a human-readable label for the Graph.
	Serialize() []byte                   // Serialize returns a full representation of the graph as bytes.
	Deserialize(b []byte) (Graph, error) // Deserialize restores the graph from the output of Serialize.

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
	LabelSet(label string) Graph                                   // LabelSet sets a new label on the Graph.
}

// InMemoryGraph implements Graph. It stores the Activity and Dependency entities in local memory.
type InMemoryGraph struct {
	Id          string               `json:"id"`          // Id is the unique ID for this graph - we can use it in GraphStore.
	Name        string               `json:"name"`        // Name is the display name for the chart.
	ActivityMap map[string]*Activity `json:"activityMap"` // ActivityMap stores Activity entities, mapped by Id.
}

func NewInMemoryGraph(title string) InMemoryGraph {
	g := InMemoryGraph{
		Name:        title,
		ActivityMap: make(map[string]*Activity),
	}
	startNode := Activity{
		Id:        "START",
		Name:      "Start",
		DependsOn: make(map[string]*Activity),
	}
	g.ActivityMap[startNode.Id] = &startNode
	g.Id = ptrId(&g)
	return g
}

func ptrId(g Graph) string {
	return fmt.Sprintf(`%v`, &g)
}

func (i *InMemoryGraph) Uid() string {
	if i.Id == "" {
		i.Id = fmt.Sprintf(`%v`, i)
	}
	return i.Id
}

func (i *InMemoryGraph) Label() string {
	return i.Name
}

func (i *InMemoryGraph) Serialize() []byte {
	b, _ := json.Marshal(*i)
	return b
}

func (i *InMemoryGraph) Deserialize(b []byte) (Graph, error) {
	err := json.Unmarshal(b, i)
	return i, err
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
	if activity.Id == "" {
		// Allow the API to simply call for a new Activity, and we can
		// let them fill in the blanks later.
		truncTs := fmt.Sprintf(`%v`, time.Now().UnixMilli())[8:]
		activity.Id = fmt.Sprintf(`RND-%s`, truncTs)
	}
	if err := i.validateIdNotExists(activity.Id); err != nil {
		return i, err
	}
	activity.DependsOn = make(map[string]*Activity, 0)
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

	// Clone dependencies inbound.
	for k, v := range i.ActivityMap[id].DependsOn {
		i.ActivityMap[newId].DependsOn[k] = v
	}
	// Clone dependencies outbound.
	for _, a := range i.ActivityMap {
		if _, ok := a.DependsOn[id]; ok {
			a.DependsOn[newId] = i.ActivityMap[newId]
		}
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

	// Move all outbound arrows from existing to this node.
	for _, a := range i.ActivityMap {
		if _, ok := a.DependsOn[existingId]; ok {
			delete(a.DependsOn, existingId)
			a.DependsOn[newId] = i.ActivityMap[newId]
		}
	}
	// Add existing to the DependsOn for the new Activity.
	i.ActivityMap[newId].DependsOn[existingId] = i.ActivityMap[existingId]

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
	for id, p := range i.ActivityMap[existingId].DependsOn {
		if p != nil {
			i.ActivityMap[newId].DependsOn[id] = p
		}
	}
	// Update the existing Activity to only rely on the new one.
	i.ActivityMap[existingId].DependsOn = map[string]*Activity{newId: i.ActivityMap[newId]}

	return i, nil
}

func (i *InMemoryGraph) ActivityPatch(id string, attrs map[string]any) (Graph, error) {
	if err := i.validateIdExists(id); err != nil {
		return i, err
	}
	j, err := json.Marshal(attrs)
	if err != nil {
		return i, err
	}
	if newIdAny, ok := attrs["id"]; ok {
		newId, isString := newIdAny.(string)
		if !isString {
			log.Error().Msg("got non-string ID on PATCH - skipping")
		}
		if isString {
			// We updated the ID, so update dependencies first.
			for _, activity := range i.ActivityMap {
				if _, hasDep := activity.DependsOn[id]; hasDep {
					activity.DependsOn[newId] = activity.DependsOn[id]
					delete(activity.DependsOn, id)
				}
			}
		}
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
		delete(a.DependsOn, id)
	}
	return i, nil
}

func (i *InMemoryGraph) Dependencies() []Dependency {
	allDeps := make([]Dependency, 0)
	for _, a := range i.ActivityMap {
		for _, d := range a.DependsOn {
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

	i.ActivityMap[nextId].DependsOn[firstId] = i.ActivityMap[firstId]

	return i, nil
}

func (i *InMemoryGraph) DependencyRemove(firstId string, nextId string) (Graph, error) {
	if err := i.validateIdExists(nextId); err != nil {
		return i, err
	}
	delete(i.ActivityMap[nextId].DependsOn, firstId)
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

func (i *InMemoryGraph) LabelSet(name string) Graph {
	i.Name = name
	return i
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
	idComponents := strings.Split(id, "+")
	if len(idComponents) > 1 {
		baseId = strings.Join(idComponents[:len(idComponents)-1], "+")
	}

	// Generate a new ID in numerical sequence.
	iteration := 1
	for {
		newId := fmt.Sprintf(`%s+%v`, baseId, iteration)
		_, ok := i.ActivityMap[newId]
		if !ok {
			return newId
		}
		iteration += 1
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
