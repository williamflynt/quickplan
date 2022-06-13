package render

import (
	"github.com/awalterschulze/gographviz"
	"strconv"
	"strings"
)

type XYPosition struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// Layout parses the DOT text and retrieves the positions of the Nodes.
func Layout(dot string) (pos map[string]XYPosition, err error) {
	pos = make(map[string]XYPosition)
	graphAst, err := gographviz.Parse([]byte(dot))
	if err != nil {
		return pos, err
	}
	g := gographviz.NewGraph()
	err = gographviz.Analyse(graphAst, g)
	if g.Nodes == nil {
		return pos, err
	}
	for _, n := range g.Nodes.Nodes {
		if p, ok := n.Attrs["pos"]; ok {
			coords := strings.Split(strings.Trim(p, "\""), ",")
			if len(coords) == 2 {
				x, parseErr := strconv.ParseFloat(coords[0], 64)
				if parseErr != nil {
					continue
				}
				y, parseErr := strconv.ParseFloat(coords[1], 64)
				if parseErr != nil {
					continue
				}
				pos[n.Name] = XYPosition{x, y}
			}
		}
	}
	return pos, nil
}
