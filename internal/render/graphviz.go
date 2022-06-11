package render

import (
	"bytes"
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
	for _, n := range c.Nodes {
		gn, err := graph.CreateNode(n.Id)
		if err != nil {
			return "", err
		}
		gn = gn.SetLabel(n.Label)
		graphNodes[n.Id] = gn
	}

	for _, a := range c.Arrows {
		e, err := graph.CreateEdge(
			a.Id,
			graphNodes[a.From],
			graphNodes[a.To],
		)
		if err != nil {
			return "", err
		}
		if a.CriticalPath {
			e.SetColor("red")
		}
	}

	buf := new(bytes.Buffer)
	if err := gvz.g.Render(graph, "dot", buf); err != nil {
		return "", err
	}
	return buf.String(), nil
}
