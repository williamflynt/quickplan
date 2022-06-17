package examples

import (
	"github.com/rs/zerolog/log"
	"quickplan/internal/render"
	"quickplan/pkg/activity"
	"quickplan/pkg/cpm"
)

func Basic() *cpm.Chart {
	g := activity.NewInMemoryGraph()
	g.LabelSet("Basic Example")
	_, _ = g.ActivityAdd(activity.Activity{
		Id:             "START",
		Name:           "Start",
		DurationLow:    0,
		DurationLikely: 0,
		DurationHigh:   0,
	})
	_, _ = g.ActivityAdd(activity.Activity{
		Id:             "A",
		Name:           "Activity A",
		DurationLow:    10,
		DurationLikely: 20,
		DurationHigh:   30,
	})
	_, _ = g.ActivityAdd(activity.Activity{
		Id:             "B",
		Name:           "Activity B",
		DurationLow:    40,
		DurationLikely: 80,
		DurationHigh:   90,
	})
	_, _ = g.ActivityAdd(activity.Activity{
		Id:             "C",
		Name:           "Activity C",
		DurationLow:    20,
		DurationLikely: 30,
		DurationHigh:   40,
	})
	_, _ = g.ActivityAdd(activity.Activity{
		Id:             "D",
		Name:           "Activity D",
		DurationLow:    20,
		DurationLikely: 20,
		DurationHigh:   80,
	})
	_, _ = g.ActivityAdd(activity.Activity{
		Id:             "E",
		Name:           "Activity E",
		DurationLow:    30,
		DurationLikely: 30,
		DurationHigh:   42,
	})
	_, _ = g.ActivityAdd(activity.Activity{
		Id:             "END",
		Name:           "End",
		DurationLow:    0,
		DurationLikely: 0,
		DurationHigh:   0,
	})

	_, _ = g.DependencyAdd("START", "A")
	_, _ = g.DependencyAdd("START", "B")
	_, _ = g.DependencyAdd("A", "C")
	_, _ = g.DependencyAdd("C", "D")
	_, _ = g.DependencyAdd("B", "D")
	_, _ = g.DependencyAdd("B", "E")
	_, _ = g.DependencyAdd("D", "END")
	_, _ = g.DependencyAdd("E", "END")

	activities := g.Activities()
	aPtrs := make([]cpm.Task, 0)
	for i := range activities {
		aPtrs = append(aPtrs, &activities[i])
	}
	c, _ := cpm.Calculate(aPtrs)
	c.Id = g.Id
	c.Title = g.Name

	laidOut, _, err := render.DotLayout(&c)
	if err != nil {
		log.Error().Err(err).Msg("error doing layout for basic example")
	}

	return laidOut
}
