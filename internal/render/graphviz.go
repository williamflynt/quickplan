package render

import (
	"bytes"
	"context"
	"fmt"
	"github.com/goccy/go-graphviz"
	"github.com/goccy/go-graphviz/cgraph"
	"github.com/rs/zerolog/log"
	"quickplan/pkg/cpm"
)

type Graphviz struct {
	g     *graphviz.Graphviz
	graph *cgraph.Graph
}

func NewGraphviz() Graphviz {
	ctx := context.Background()
	g, _ := graphviz.New(ctx)
	return Graphviz{g: g}
}

func (gvz *Graphviz) Render(c *cpm.Chart) (string, error) {
	defer func() {
		if r := recover(); r != nil {
			log.Error().Msg("SIGSEGV in graphviz.Render")
		}
	}()

	graph, err := gvz.g.Graph()
	graph.SetRankDir("LR") // Flow this chart out left to right.
	gvz.graph = graph
	if err != nil {
		return "", err
	}

	graph.SetLabel(c.Title)

	// Map of our Node.Id to the graphviz Node.
	graphNodes := make(map[string]*cgraph.Node)
	for i := range c.Nodes {
		gn, err := graph.CreateNodeByName(c.Nodes[i].Id)
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
		e, err := graph.CreateEdgeByName(
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
	// TODO: Calling this function can cause a C SIGSEGV - which we can't catch in Go.
	//   We implemented a recover, but why/when does it happen? (wf 14 June 22)
	ctx := context.Background()
	if err := gvz.g.Render(ctx, graph, "dot", buf); err != nil {
		return "", err
	}
	return buf.String(), nil
}
