package cpm

import (
	"fmt"
	"github.com/cockroachdb/errors"
	"sync"
)

// Task is a unit of work in a project.
type Task interface {
	Uid() string          // Uid is the unique ID for this Task.
	Duration() float64    // Duration is the estimated duration for a Task.
	Label() string        // Label is the human-friendly label for Task.
	Predecessors() []Task // Predecessors is the Uid listing of previous Task items.
}

type Node struct {
	Id             string  `json:"id"`
	Duration       float64 `json:"duration"`
	Label          string  `json:"label"`
	EarliestStart  float64 `json:"earliestStart"`
	EarliestFinish float64 `json:"earliestFinish"`
	Slack          float64 `json:"slack"`

	task         Task
	dependsOn    []*Node
	isDepOf      []*Node
	calcComplete bool
	lock         sync.Mutex
}

func (n *Node) IsDepOf(nn *Node) {
	// Assumes no duplicates!
	n.isDepOf = append(n.isDepOf, nn)
}

func (n *Node) DependsOn(nn *Node) {
	// Assumes no duplicates!
	n.dependsOn = append(n.dependsOn, nn)
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

	starts := chart.buildNodesArrows(tasks)
	if len(starts) == 0 {
		return chart, errors.New("cycle detected - no starts found")
	}

	for _, n := range starts {
		calculateStartFinish(n)
	}

	err = chart.findCriticalPath()
	return chart, err
}

func (c *Chart) buildNodesArrows(tasks []Task) []*Node {
	nodes := make(map[string]*Node)
	arrowIds := make(map[string]string)

	for _, t := range tasks {
		n := nodeFromTask(t)
		nodes[n.Id] = n
		c.Nodes = append(c.Nodes, n)
	}

	for _, t := range tasks {
		for _, p := range t.Predecessors() {
			n := nodes[t.Uid()]
			n.DependsOn(nodes[p.Uid()])
			arrowIds[t.Uid()] = p.Uid()
		}
	}

	starts := make([]*Node, 0)
	for _, n := range c.Nodes {
		if len(n.dependsOn) == 0 {
			starts = append(starts, n)
			continue
		}
		for _, d := range n.dependsOn {
			d.IsDepOf(n)
		}
	}

	arrows := make([]Arrow, len(arrowIds))
	for k, v := range arrowIds {
		// Set critical path boolean later.
		id := fmt.Sprintf(`%s->%s`, k, v)
		arrows = append(arrows, Arrow{id, k, v, false})
	}
	c.Arrows = arrows

	return starts
}

func (c *Chart) findCriticalPath() error {
	ends := make([]*Node, 0)
	maxFin := float64(0)
	for _, n := range c.Nodes {
		if len(n.isDepOf) == 0 {
			if n.EarliestFinish < maxFin {
				continue
			}
			if n.EarliestFinish > maxFin {
				ends = []*Node{n}
				continue
			}
			ends = append(ends, n)
		}
	}
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

func calculateStartFinish(n *Node) {
	n.lock.Lock()
	if n.calcComplete {
		return
	}
	for _, nn := range n.dependsOn {
		if n.EarliestStart < nn.EarliestFinish {
			if !nn.calcComplete {
				calculateStartFinish(nn)
			}
			n.EarliestStart = nn.EarliestFinish
		}
	}
	n.EarliestFinish = n.EarliestStart + n.Duration
	n.calcComplete = true
	n.lock.Unlock()
	// Recur through the graph.
	for _, nn := range n.isDepOf {
		calculateStartFinish(nn)
	}
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
		EarliestFinish: 0,
		Slack:          0,
		task:           t,
		dependsOn:      before,
		isDepOf:        after,
	}
}
