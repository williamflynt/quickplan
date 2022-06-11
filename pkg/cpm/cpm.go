package cpm

import (
	"fmt"
	"github.com/cockroachdb/errors"
	"sync"
)

// Task is a unit of work in a project.
type Task interface {
	Uid() string            // Uid is the unique ID for this Task.
	Duration() float64      // Duration is the estimated duration for a Task.
	Label() string          // Label is the human-friendly label for Task.
	Predecessors() []string // Predecessors is the Uid listing of previous Task items.
}

type Node struct {
	Id             string  `json:"id"`
	Duration       float64 `json:"duration"`
	Label          string  `json:"label"`
	EarliestStart  float64 `json:"earliestStart"`
	EarliestFinish float64 `json:"earliestFinish"`
	LatestStart    float64 `json:"latestStart"`
	LatestFinish   float64 `json:"latestFinish"`
	Slack          float64 `json:"slack"`

	task              Task
	dependsOn         []*Node // dependsOn contains the Nodes that this one needs to run first.
	requiredBy        []*Node // requiredBy contains the Nodes that require this one to run first.
	earlyCalcComplete bool
	lateCalcComplete  bool
	lock              sync.Mutex
}

type Arrow struct {
	Id           string `json:"id"`
	From         string `json:"from"`
	To           string `json:"to"`
	CriticalPath bool   `json:"criticalPath"`
}

type Chart struct {
	Nodes  []*Node `json:"nodes"`
	Arrows []Arrow `json:"arrows"`
	Title  string  `json:"title"`
}

func Calculate(tasks []Task) (chart Chart, err error) {

	starts, ends := chart.buildNodesArrows(tasks)
	if len(starts) == 0 {
		return chart, errors.New("cycle detected - no starts found")
	}

	// Forward pass.
	for _, n := range starts {
		calculateEarlyStartFinish(n)
	}
	// Backward pass.
	for _, n := range ends {
		chart.calculateLateStartFinish(n)
	}

	err = chart.findCriticalPath(ends)
	return chart, err
}

func (c *Chart) buildNodesArrows(tasks []Task) (starts []*Node, ends []*Node) {
	// Mapping of Task ID to Node pointer.
	nodes := make(map[string]*Node)
	// Mapping of Task ID to Task ID.
	arrowIds := make(map[string]string)

	for _, t := range tasks {
		n := nodeFromTask(t)
		nodes[n.Id] = n
		c.Nodes = append(c.Nodes, n)
	}

	// We've gone through all Tasks, so all should have Nodes.
	for _, t := range tasks {
		nt := nodes[t.Uid()]
		for _, p := range t.Predecessors() {
			np := nodes[p]
			// Get this Task's Node, then add its Predecessors to `dependsOn`.
			nt.dependsOn = append(nt.dependsOn, np)
			// Also add this Task to the Predecessor's requiredBy.
			np.requiredBy = append(np.requiredBy, nt)
			arrowIds[nt.Id] = np.Id
		}
	}

	// Get the starter and ender Nodes.
	for _, n := range c.Nodes {
		// If it depends on nothing, it's a starter Node.
		if len(n.dependsOn) == 0 {
			starts = append(starts, n)
			continue
		}
		// If it's requiredBy nothing, it's an ender Node.
		if len(n.requiredBy) == 0 {
			ends = append(ends, n)
			continue
		}
	}

	arrows := make([]Arrow, len(arrowIds))
	for k, v := range arrowIds {
		// Set critical path boolean later.
		id := fmt.Sprintf(`%s->%s`, k, v)
		arrows = append(arrows, Arrow{id, k, v, false})
	}
	c.Arrows = arrows

	return starts, ends
}

func (c *Chart) findCriticalPath(ends []*Node) error {
	if len(ends) == 0 {
		return errors.New("cycle detected - no ends found")
	}

	criticalPath := make(map[string]struct{}, 0)
	for _, n := range ends {
		criticalPath = addToCriticalPath(n, criticalPath)
	}
	for i, existing := range c.Arrows {
		if _, ok := criticalPath[existing.Id]; ok {
			// This arrow might be in the critical path. Let's check.
			c.Arrows[i].CriticalPath = true
		}
	}

	return nil
}

func addToCriticalPath(node *Node, arrowIds map[string]struct{}) map[string]struct{} {
	if len(node.dependsOn) == 0 {
		return arrowIds
	}
	latest := findLatestNodes(node.dependsOn)
	for _, n := range latest {
		id := fmt.Sprintf(`%s->%s`, n.Id, node.Id)
		arrowIds[id] = struct{}{}
		addToCriticalPath(n, arrowIds)
	}
	return arrowIds
}

// calculateEarlyStartFinish does a forward pass over the Nodes in the Chart to calculate
// the earliest start and finish Duration - prior to finding the critical path.
func calculateEarlyStartFinish(n *Node) {
	n.lock.Lock()
	if n.earlyCalcComplete {
		n.lock.Unlock()
		return
	}
	// Find this Node's earliest start time based on the earliest finish time of upstream.
	// This loop finds the greatest upstream finish time and uses it.
	for _, lookBack := range n.dependsOn {
		// If this Node's earliest start is before the upstream earliest finish, that's not possible.
		// Run the calc for that Node (if not already done), and set this Node's earliest start time.
		if n.EarliestStart < lookBack.EarliestFinish {
			if !lookBack.earlyCalcComplete {
				calculateEarlyStartFinish(lookBack)
			}
			n.EarliestStart = lookBack.EarliestFinish
		}
	}

	n.EarliestFinish = n.EarliestStart + n.Duration
	n.earlyCalcComplete = true
	n.lock.Unlock()
	// Recur forward through the graph.
	for _, lookAhead := range n.requiredBy {
		calculateEarlyStartFinish(lookAhead)
	}
}

// calculateLateStartFinish does a backward pass over the Nodes in the Chart to calculate
// the latest start and finish Duration.
func (c *Chart) calculateLateStartFinish(n *Node) {
	n.lock.Lock()
	defer n.lock.Unlock()

	if len(n.dependsOn) == 0 {
		// This is a starter Node.
		n.lateCalcComplete = true
		return
	}
	if len(n.requiredBy) == 0 {
		// This is an ender Node. The below is just in case we have multiple ender Nodes.
		maxFinChart := findLatestNodes(c.Nodes)[0].EarliestFinish
		n.LatestFinish = maxFinChart
		n.LatestStart = n.LatestFinish - n.Duration
	}

	// Find the Nodes that require this one (lookBack) and get the latest finish.
	maxFin := findLatestNodes(n.dependsOn)[0].EarliestFinish
	// Given that latest finish, apply it to get latest values for each lookBack Node.
	for _, lookBack := range n.dependsOn {
		if lookBack.lateCalcComplete {
			return
		}
		lookBack.LatestFinish = maxFin - 1
		lookBack.LatestStart = lookBack.LatestFinish - lookBack.Duration
		c.calculateLateStartFinish(lookBack)
	}
	n.Slack = n.LatestFinish - n.EarliestFinish
	n.lateCalcComplete = true
}

func findLatestNodes(nodes []*Node) (latest []*Node) {
	maxFin := float64(0)
	for _, n := range nodes {
		if n.EarliestFinish < maxFin {
			continue
		}
		if n.EarliestFinish > maxFin {
			latest = []*Node{n}
			continue
		}
		latest = append(latest, n)
	}
	return latest
}

func nodeFromTask(t Task) *Node {
	before := make([]*Node, 0)
	after := make([]*Node, 0)
	return &Node{
		Id:             t.Uid(),
		Duration:       t.Duration(),
		Label:          t.Label(),
		EarliestStart:  0,
		EarliestFinish: t.Duration(),
		LatestStart:    0,
		LatestFinish:   t.Duration(),
		Slack:          0,
		task:           t,
		dependsOn:      before,
		requiredBy:     after,
	}
}
