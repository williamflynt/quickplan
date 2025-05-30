package cpm

import (
	"fmt"
	"github.com/cockroachdb/errors"
	"math"
)

// Task is a unit of work in a project.
type Task interface {
	Uid() string             // Uid is the unique ID for this Task.
	Title() string           // Title is the human-readable label for this Task.
	Description() string     // Description is a longer-form description of this Task.
	Meta() map[string]string // Meta is a key:value map of additional data about this Task.
	Duration() float64       // Duration is the aggregated estimated duration for a Task.
	DurationL() int          // DurationL is the low estimated duration for a Task.
	DurationM() int          // DurationM is the likely estimated duration for a Task.
	DurationH() int          // DurationH is the high estimated duration for a Task.
	Predecessors() []string  // Predecessors is the Uid listing of previous Task items.
}

type NodePosition struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type Node struct {
	Id          string            `json:"id"`
	Title       string            `json:"title"`
	Description string            `json:"description"`
	Meta        map[string]string `json:"meta"`
	Position    NodePosition      `json:"position"`

	Duration       float64 `json:"duration"`
	DurationLow    int     `json:"durationLow"`    // DurationLow is the minimum length to accomplish the Task in arbitrary units.
	DurationLikely int     `json:"durationLikely"` // DurationLikely is the most likely length to accomplish the Task in arbitrary units.
	DurationHigh   int     `json:"durationHigh"`   // DurationHigh is the longest length to accomplish the Task in arbitrary units.

	Label          string  `json:"label"`
	EarliestStart  float64 `json:"earliestStart"`
	EarliestFinish float64 `json:"earliestFinish"`
	LatestStart    float64 `json:"latestStart"`
	LatestFinish   float64 `json:"latestFinish"`
	Slack          float64 `json:"slack"`

	task         Task    // Task is the root data this Node was initialized from.
	predecessors []*Node // predecessors contains the Nodes that this one needs to run first.
	requiredBy   []*Node // requiredBy contains the Nodes that require this one to run first.

	fwdPassDone  bool // fwdPassDone indicates whether this Node has completed calcs for Earliest times.
	backPassDone bool // backPassDone indicates whether this Node has completed calcs for Latest times.
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
	Id     string  `json:"id"`
	Title  string  `json:"title"`
}

func Calculate(tasks []Task) (chart Chart, err error) {

	starts, ends := chart.buildNodesArrows(tasks)
	if len(starts) == 0 {
		return chart, errors.New("cycle detected - no starts found")
	}

	for _, n := range starts {
		doForwardPass(n) // Mutates Nodes.
	}

	for _, n := range ends {
		doBackwardPass(n, ends...) // Mutates Nodes.
	}

	err = chart.findCriticalPath(ends) // Mutates arrows and Chart.
	return chart, err
}

func (c *Chart) buildNodesArrows(tasks []Task) (starts []*Node, ends []*Node) {
	// Mapping of Task ID to Node pointer.
	nodes := make(map[string]*Node)

	for _, t := range tasks {
		if t == nil {
			continue
		}
		n := nodeFromTask(t)
		nodes[n.Id] = n
		c.Nodes = append(c.Nodes, n)
	}

	// We've gone through all Tasks, so all should have Nodes.
	for _, t := range tasks {
		nt := nodes[t.Uid()]
		for _, p := range t.Predecessors() {
			np := nodes[p]
			// Get this Task's Node, then add its Predecessors to `predecessors`.
			nt.predecessors = append(nt.predecessors, np)
			// Also add this Task to the Predecessor's requiredBy.
			np.requiredBy = append(np.requiredBy, nt)
			// Set critical path boolean later.
			id := fmt.Sprintf(`%s->%s`, np.Id, nt.Id)
			c.Arrows = append(c.Arrows, Arrow{id, np.Id, nt.Id, false})
		}
	}

	// Get the starter and ender Nodes.
	for _, n := range c.Nodes {
		// If it depends on nothing, it's a starter Node.
		if len(n.predecessors) == 0 {
			starts = append(starts, n)
			continue
		}
		// If it's requiredBy nothing, it's an ender Node.
		if len(n.requiredBy) == 0 {
			ends = append(ends, n)
			continue
		}
	}

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
	if len(node.predecessors) == 0 {
		return arrowIds
	}
	latest := findLatestNodes(node.predecessors)
	for _, n := range latest {
		id := fmt.Sprintf(`%s->%s`, n.Id, node.Id)
		arrowIds[id] = struct{}{}
		addToCriticalPath(n, arrowIds)
	}
	return arrowIds
}

// setEarlyStartFinish
func setEarlyStartFinish(n *Node) (start float64, finish float64) {
	if n.fwdPassDone {
		return n.EarliestStart, n.EarliestFinish
	}
	for i := range n.predecessors {
		_, fin := setEarlyStartFinish(n.predecessors[i])
		if fin > n.EarliestStart {
			n.EarliestStart = tenthRound(fin)
		}
	}
	n.EarliestFinish = tenthRound(n.EarliestStart + n.Duration)
	return n.EarliestStart, n.EarliestFinish
}

// setLateStartFinish
// This is different from setEarlyStartFinish in an important respect - when you're
// setting early times, you only move backward. In this function, we move backward,
// but then look ahead for value comparisons. That's why the structure is slightly
// different between them.
// Ensure we're calculating LS/LF for all end nodes before calling this for the rest,
// to account for multi-end graphs!
func setLateStartFinish(n *Node) (start float64, finish float64) {
	if n.backPassDone {
		return n.LatestStart, n.LatestFinish
	}
	if !n.fwdPassDone {
		// Forward pass must come first!
		doForwardPass(n)
	}
	for i := range n.requiredBy {
		// We can't keep going until Nodes after this one have a LatestStart time.
		if !n.requiredBy[i].backPassDone {
			doBackwardPass(n.requiredBy[i])
		}
		s, _ := setLateStartFinish(n.requiredBy[i])
		if i == 0 {
			n.LatestFinish = tenthRound(s)
		}
		if n.LatestFinish > s {
			n.LatestFinish = tenthRound(s)
		}
	}
	n.LatestStart = tenthRound(n.LatestFinish - n.Duration)
	n.Slack = tenthRound(n.LatestFinish - n.EarliestFinish)
	return n.LatestStart, n.LatestFinish
}

// doBackwardPass does a backward pass over the Nodes in the Chart to calculate
// the latest start and finish Duration.
func doBackwardPass(n *Node, ends ...*Node) {
	for i := range ends {
		ends[i].LatestStart = tenthRound(ends[i].EarliestStart)
		ends[i].LatestFinish = tenthRound(ends[i].EarliestFinish)
	}
	for i, e := range ends {
		// Take the highest latest finish from the group and use for all ender nodes.
		if e.LatestFinish > n.LatestFinish {
			for j := range ends {
				ends[j].LatestFinish = tenthRound(e.LatestFinish)
				ends[j].LatestStart = tenthRound(e.LatestFinish - ends[i].Duration)
				ends[j].Slack = tenthRound(e.LatestFinish - ends[i].EarliestFinish)
			}
		}
	}
	for i := range ends {
		ends[i].backPassDone = true
	}
	setLateStartFinish(n)
	n.backPassDone = true
	for i := range n.predecessors {
		doBackwardPass(n.predecessors[i])
	}
}

// doForwardPass does a forward pass over the Nodes in the Chart to calculate
// the earliest start and finish Duration - prior to finding the critical path.
func doForwardPass(n *Node) {
	setEarlyStartFinish(n)
	n.fwdPassDone = true
	for i := range n.requiredBy {
		doForwardPass(n.requiredBy[i])
	}
}

func findLatestNodes(nodes []*Node) (latest []*Node) {
	maxFin := float64(0)
	for _, n := range nodes {
		if n.EarliestFinish > maxFin {
			maxFin = n.EarliestFinish
		}
	}
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
		Title:          t.Title(),
		Description:    t.Description(),
		Meta:           t.Meta(),
		Duration:       t.Duration(),
		DurationLow:    t.DurationL(),
		DurationLikely: t.DurationM(),
		DurationHigh:   t.DurationH(),
		EarliestStart:  0,
		EarliestFinish: t.Duration(),
		LatestStart:    0,
		LatestFinish:   t.Duration(),
		Slack:          0,
		task:           t,
		predecessors:   before,
		requiredBy:     after,
	}
}

func tenthRound(f float64) float64 {
	ratio := math.Pow(10, 1.0)
	return math.Round(f*ratio) / ratio
}
