package pfs

import "errors"

// COMMAND PARSING

type idAndType struct {
	Id   string `json:"id" yaml:"id"`
	Type string `json:"type" yaml:"type"`
}

func insertDependency(node *ASTNode, project *Project) error {
	left := make([]idAndType, 0)
	right := make([]idAndType, 0)

	negate := false  // Whether we've seen the negation flag for this operation.
	onRight := false // Whether we're on the right of the operator.
	for _, child := range node.Children {
		switch child.Type {
		case "negation_op":
			negate = true
		case "required_by_op":
			onRight = true
		case "milestone":
			m, err := milestone(child)
			if err != nil {
				return err
			}
			left = right
			right = []idAndType{{m.Id, "milestone"}}
			project.Milestones[m.Id] = mergeMilestone(project.Milestones[m.Id], m)
			if onRight && len(right) > 0 {
				project.Dependencies = handleDepExpr(left, right, negate, project.Dependencies)
			}
		case "tasks":
			taskMap, err := tasks(child)
			if err != nil {
				return err
			}
			left = right
			right = make([]idAndType, 0)
			for k, v := range taskMap {
				right = append(right, idAndType{k, "task"})
				project.Tasks[k] = mergeTask(project.Tasks[k], v)
			}
			if onRight && len(right) > 0 {
				project.Dependencies = handleDepExpr(left, right, negate, project.Dependencies)
				// Once we are on the right of the operator, we'll always be on the right.
				// So don't bother with onRight, just reset `negate`.
				negate = false
			}
		}
	}
	return nil
}

func splitTask(node *ASTNode, project *Project) error {
	// This is like task mitosis. The * shows which side the "child" is on.
	// The `* > myTask` means to insert a new operation where myTask is, inheriting all its upstreams.
	// Make myTask have a single dependency - the new task. Downstreams from myTask stay the same.
	existingTask := Task{}
	newTaskIdx := -1
	for i, child := range node.Children {
		switch child.Type {
		case "new_task_sigil":
			newTaskIdx = i
		case "task":
			existing, err := task(child)
			if err != nil {
				return err
			}
			existingTask = existing
		}
	}
	prefix := "post-" // TODO: fix the actual syntax to match `X > *` properly
	if newTaskIdx == 0 {
		prefix = "pre-"
	}
	newTask := Task{
		Id:         prefix + existingTask.Id, // TODO: ensure unique key for every task insert, always
		Attributes: map[string]string{},
	}
	project.Tasks[newTask.Id] = newTask
	if newTaskIdx == 0 {
		for i := range project.Dependencies {
			if project.Dependencies[i].Dest == existingTask.Id && project.Dependencies[i].DestType == "task" {
				project.Dependencies[i].Dest = newTask.Id
			}
		}
		project.Dependencies = append(project.Dependencies, Dependency{Src: newTask.Id, SrcType: "task", Dest: existingTask.Id, DestType: "task"})
	} else {
		for i := range project.Dependencies {
			if project.Dependencies[i].Src == existingTask.Id && project.Dependencies[i].SrcType == "task" {
				project.Dependencies[i].Src = newTask.Id
			}
		}
		project.Dependencies = append(project.Dependencies, Dependency{Src: existingTask.Id, Dest: newTask.Id})
	}
	return nil
}

func entityCreateOrUpdate(node *ASTNode, project *Project) error {
	for _, child := range node.Children {
		switch child.Type {
		case "entity":
			return entityCreateOrUpdate(child, project)
		case "task":
			t, err := task(child)
			if err != nil {
				return err
			}
			project.Tasks[t.Id] = t // TODO: merge
		case "milestone":
			m, err := milestone(child)
			if err != nil {
				return err
			}
			project.Milestones[m.Id] = m // TODO: merge
		case "resource":
			r, err := resource(child)
			if err != nil {
				return err
			}
			project.Resources[r.Id] = r // TODO: merge
		default:
			return errors.New("unknown entity type")
		}
	}
	return nil
}

func entityRemove(node *ASTNode, project *Project) error {
	if node.Type == "entity_remove" {
		for _, child := range node.Children {
			if child.Type == "entity" {
				return entityRemove(child.Children[0], project)
			}
		}
		return errors.New("no entity node found")
	}
	if node.Type != "task" && node.Type != "milestone" && node.Type != "resource" {
		return errors.New("unknown entity type")
	}
	entityId, found := getEntityId(node)
	if !found {
		return errors.New("entity ID not found")
	}
	project.Assignments = filterFromAssignments(entityId, node.Type, project.Assignments)
	project.Clusters = filterFromClusters(entityId, node.Type, project.Clusters)
	project.Dependencies = filterFromDeps(entityId, node.Type, project.Dependencies)

	if node.Type == "task" {
		delete(project.Tasks, entityId)
		project.Assignments = filterFromAssignments(entityId, node.Type, project.Assignments)
		project.Clusters = filterFromClusters(entityId, node.Type, project.Clusters)
		project.Dependencies = filterFromDeps(entityId, node.Type, project.Dependencies)
	}
	if node.Type == "milestone" {
		delete(project.Milestones, entityId)
		project.Clusters = filterFromClusters(entityId, node.Type, project.Clusters)
		project.Dependencies = filterFromDeps(entityId, node.Type, project.Dependencies)
	}
	if node.Type == "resource" {
		delete(project.Resources, entityId)
		project.Assignments = filterFromAssignments(entityId, node.Type, project.Assignments)
	}
	return nil
}

// ENTITY EXTRACTION

func milestone(node *ASTNode) (Milestone, error) {
	attrs, err := attributes(node)
	if err != nil {
		return Milestone{}, err
	}
	return Milestone{
		Id:         node.Children[1].Value,
		Attributes: attrs,
	}, nil
}

func resource(node *ASTNode) (Resource, error) {
	attrs, err := attributes(node)
	if err != nil {
		return Resource{}, err
	}
	return Resource{
		Id:         node.Children[1].Value,
		Attributes: attrs,
	}, nil
}

func tasks(node *ASTNode) (map[string]Task, error) {
	taskMap := make(map[string]Task)
	for _, child := range node.Children {
		switch child.Type {
		case "task":
			t, err := task(child)
			if err != nil {
				panic("invalid task")
			}
			taskMap[t.Id] = t
		}
	}
	return taskMap, nil
}

func task(node *ASTNode) (Task, error) {
	attrs, err := attributes(node)
	if err != nil {
		return Task{}, err
	}
	return Task{
		Id:         node.Children[0].Value,
		Attributes: attrs,
	}, nil

}

func attributes(node *ASTNode) (map[string]string, error) {
	attrs := make(map[string]string)
	if node.Type == "attributes" {
		for _, child := range node.Children {
			switch child.Type {
			case "attribute":
				k, v := attribute(child)
				attrs[k] = v
			}
		}
		return attrs, nil
	}
	for _, child := range node.Children {
		switch child.Type {
		case "attributes":
			return attributes(child)
		}
	}
	return attrs, nil
}

func attribute(node *ASTNode) (string, string) {
	// Just hacking it out. Don't judge.
	return node.Children[0].Children[0].Value, node.Children[2].Value
}

// HELPERS

func getEntityId(node *ASTNode) (string, bool) {
	if node.Type == "identifier" {
		return node.Value, true
	}
	for _, child := range node.Children {
		childId, found := getEntityId(child)
		if found {
			return childId, true
		}
	}
	return "", false
}

func filterFromAssignments(id string, typeOf string, assignments []Assignment) []Assignment {
	newAssignments := make([]Assignment, 0)
	for _, a := range assignments {
		if (a.TaskId == id && typeOf == "task") || (a.ResourceId == id && typeOf == "resource") {
			continue
		}
		newAssignments = append(newAssignments, a)
	}
	return newAssignments
}

func filterFromClusters(id string, typeOf string, clusters map[string]Cluster) map[string]Cluster {
	for _, c := range clusters {
		if typeOf == "task" {
			delete(c.Tasks, id)
		}
		if typeOf == "milestone" {
			delete(c.Milestones, id)
		}
	}
	return clusters
}

func filterFromDeps(id string, typeOf string, deps []Dependency) []Dependency {
	newDeps := make([]Dependency, 0)
	for _, dep := range deps {
		if (dep.Src == id && dep.SrcType == typeOf) || (dep.Dest == id && dep.DestType == typeOf) {
			continue
		}
		newDeps = append(newDeps, dep)
	}
	return newDeps
}

func mergeAttributes(existing, new map[string]string) map[string]string {
	if existing == nil && new == nil {
		return make(map[string]string)
	}
	if existing == nil {
		return new
	}
	if new == nil {
		return existing
	}
	for k, v := range new {
		if v == "~" {
			delete(existing, k)
			continue
		}
		existing[k] = v
	}
	return existing
}

func mergeMilestone(existing, new Milestone) Milestone {
	existing.Attributes = mergeAttributes(existing.Attributes, new.Attributes)
	return existing
}

func mergeResource(existing, new Resource) Resource {
	existing.Attributes = mergeAttributes(existing.Attributes, new.Attributes)
	return existing
}

func mergeTask(existing, new Task) Task {
	existing.Attributes = mergeAttributes(existing.Attributes, new.Attributes)
	return existing
}

// dependencyTrie helps search quickly for matching dependency
// Shape is { SrcId: { DestId: { SrcType: DestType } } }
type dependencyTrie map[string]map[string]map[string]bool

func (d dependencyTrie) addDependency(lk, rk idAndType) {
	if _, ok := d[lk.Id]; !ok {
		d[lk.Id] = map[string]map[string]bool{rk.Id: {lk.Type + rk.Type: true}}
		return
	}
	if _, ok := d[lk.Id][rk.Id]; !ok {
		d[lk.Id][rk.Id] = map[string]bool{lk.Type + rk.Type: true}
		return
	}
	if found, ok := d[lk.Id][rk.Id][lk.Type+rk.Type]; !ok || !found {
		d[lk.Id][rk.Id][lk.Type+rk.Type] = true
	}
}

func (d dependencyTrie) contains(dep Dependency) bool {
	if _, ok := d[dep.Src]; !ok {
		return false
	}
	if _, ok := d[dep.Src][dep.Dest]; !ok {
		return false
	}
	if found, ok := d[dep.Src][dep.Dest][dep.SrcType+dep.DestType]; !found || !ok {
		return false
	}
	return true
}

func handleDepExpr(left []idAndType, right []idAndType, negate bool, oldDeps []Dependency) []Dependency {
	// Remove old dependencies.
	if negate {
		removeTrie := make(dependencyTrie)
		for _, lk := range left {
			for _, rk := range right {
				removeTrie.addDependency(lk, rk)
			}
		}
		prunedDeps := make([]Dependency, 0)
		for _, dep := range oldDeps {
			if !removeTrie.contains(dep) {
				prunedDeps = append(prunedDeps, dep)
			}
		}
		return prunedDeps
	}

	// Build new dependencies.
	for _, lk := range left {
		for _, rk := range right {
			oldDeps = append(oldDeps, Dependency{
				Src:      lk.Id,
				SrcType:  lk.Type,
				Dest:     rk.Id,
				DestType: rk.Type,
			})
		}
	}
	return oldDeps
}
