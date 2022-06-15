package render

import (
	"github.com/awalterschulze/gographviz"
	"quickplan/pkg/cpm"
	"strconv"
	"strings"
)

type XYPosition struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// DotLayout parses the DOT text and retrieves the positions of the Nodes.
func DotLayout(c *cpm.Chart) (outC *cpm.Chart, pos map[string]XYPosition, err error) {
	pos = make(map[string]XYPosition)
	gvz := NewGraphviz()
	dot, err := gvz.Render(c)
	if err != nil {
		return c, pos, err
	}

	graphAst, err := gographviz.Parse([]byte(dot))
	if err != nil {
		return c, pos, err
	}

	g := gographviz.NewGraph()
	err = gographviz.Analyse(graphAst, g)
	if g.Nodes == nil {
		return c, pos, err
	}

	for _, n := range g.Nodes.Nodes {
		if p, ok := n.Attrs["pos"]; ok {
			if xy, err := coordsToXYPos(p); err == nil && xy != nil {
				pos[n.Name] = *xy
			}
		}
	}
	for i, n := range c.Nodes {
		if p, ok := pos[n.Id]; ok {
			c.Nodes[i].Position.X = p.X
			c.Nodes[i].Position.Y = p.Y
		}
	}
	return c, pos, nil
}

func coordsToXYPos(posStr string) (*XYPosition, error) {
	coords := strings.Split(strings.Trim(posStr, "\""), ",")
	pos := XYPosition{}
	if len(coords) == 2 {
		x, parseErr := strconv.ParseFloat(coords[0], 64)
		if parseErr != nil {
			return nil, parseErr
		}
		y, parseErr := strconv.ParseFloat(coords[1], 64)
		if parseErr != nil {
			return nil, parseErr
		}
		pos.X = x
		pos.Y = y
	}
	return &pos, nil
}
