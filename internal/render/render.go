package render

import "quickplan/pkg/cpm"

type ChartRenderer interface {
	Render(c *cpm.Chart) (string, error)
}
