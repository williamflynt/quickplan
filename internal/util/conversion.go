package util

import (
	"encoding/json"
	"github.com/cockroachdb/errors"
	"github.com/rs/zerolog/log"
	"quickplan/internal/render"
	"quickplan/pkg/activity"
	"quickplan/pkg/cpm"
)

func ChartJsonToGraph(data []byte) (activity.Graph, error) {
	c := new(cpm.Chart)
	if err := json.Unmarshal(data, c); err != nil {
		log.Info().Err(err).Msg("improper body for Chart")
		return nil, err
	}
	g := ChartToGraph(*c)
	return g, nil
}

// ChartToGraph converts a cpm.Chart to an activity.Graph.
func ChartToGraph(c cpm.Chart) activity.Graph {
	g := activity.NewInMemoryGraph()
	g.LabelSet(c.Title)
	g.Id = c.Id
	g.ActivityMap = make(map[string]*activity.Activity) // Reset the activity map because we initialize with starter nodes.

	for _, n := range c.Nodes {
		a := activity.Activity{
			Id:             n.Id,
			Name:           n.Title,
			Descr:          n.Description,
			DurationLow:    n.DurationLow,
			DurationLikely: n.DurationLikely,
			DurationHigh:   n.DurationHigh,
		}
		if _, err := g.ActivityAdd(a); err != nil {
			log.Error().Err(err).Msg("error adding activity")
		}
	}
	for _, a := range c.Arrows {
		if _, err := g.DependencyAdd(a.From, a.To); err != nil {
			log.Error().Err(err).Msg("error adding dependency")
		}
	}
	return &g
}

// GraphToChart runs through the CPM calculations, does layout, and returns the Chart as JSON.
func GraphToChart(g activity.Graph) cpm.Chart {
	activities := g.Activities()
	aPtrs := make([]cpm.Task, 0)
	for i := range activities {
		aPtrs = append(aPtrs, &activities[i])
	}
	c, _ := cpm.Calculate(aPtrs)
	c.Id = g.Uid()
	c.Title = g.Label()

	laidOut, _, err := render.DotLayout(&c)
	if err != nil {
		log.Error().Err(err).Msg("error doing Layout for chart in handler")
	}

	return *laidOut
}

// GraphToChartJson runs through the CPM calculations, does layout, and returns the Chart as JSON.
func GraphToChartJson(g activity.Graph) ([]byte, error) {
	if g == nil {
		return nil, errors.New("got nil pointer to Graph")
	}

	c := GraphToChart(g)

	b, err := json.Marshal(&c)
	if err != nil {
		log.Warn().Err(err).Msg("error marshalling Chart")
	}
	return b, err
}
