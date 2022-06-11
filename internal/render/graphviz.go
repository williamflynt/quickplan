package render

import (
	"bytes"
	"fmt"
	"github.com/goccy/go-graphviz"
	"github.com/goccy/go-graphviz/cgraph"
	"quickplan/pkg/cpm"
)

type Graphviz struct {
	g     *graphviz.Graphviz
	graph *cgraph.Graph
}

func NewGraphviz() Graphviz {
	g := graphviz.New()
	graphviz.StrictDirected(g)
	return Graphviz{g: g}
}

func (gvz *Graphviz) Render(c *cpm.Chart) (string, error) {
	graph, err := gvz.g.Graph()
	gvz.graph = graph
	if err != nil {
		return "", err
	}

	graph.SetLabel(c.Title)

	// Map of our Node.Id to the graphviz Node.
	graphNodes := make(map[string]*cgraph.Node)
	for i := range c.Nodes {
		gn, err := graph.CreateNode(c.Nodes[i].Id)
		if err != nil {
			return "", err
		}
		timeData := fmt.Sprintf(
			`%.1f|%.1f @ %.1f`,
			c.Nodes[i].EarliestFinish,
			c.Nodes[i].LatestFinish,
			c.Nodes[i].Slack,
		)
		gn = gn.SetLabel(c.Nodes[i].Label).SetXLabel(timeData)
		graphNodes[c.Nodes[i].Id] = gn
	}

	for i := range c.Arrows {
		e, err := graph.CreateEdge(
			c.Arrows[i].Id,
			graphNodes[c.Arrows[i].From],
			graphNodes[c.Arrows[i].To],
		)
		if err != nil {
			return "", err
		}
		if c.Arrows[i].CriticalPath {
			e.SetColor("red")
		}
	}

	buf := new(bytes.Buffer)
	if err := gvz.g.Render(graph, "dot", buf); err != nil {
		return "", err
	}
	return buf.String(), nil
}
