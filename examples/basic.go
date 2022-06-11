package examples

import (
	"quickplan/internal/render"
	"quickplan/pkg/activity"
	"quickplan/pkg/cpm"
)

func Basic() (*cpm.Chart, string) {
	g := activity.NewInMemoryGraph("Basic Example")
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
		DurationLow:    1,
		DurationLikely: 2,
		DurationHigh:   3,
	})
	_, _ = g.ActivityAdd(activity.Activity{
		Id:             "B",
		Name:           "Activity B",
		DurationLow:    4,
		DurationLikely: 8,
		DurationHigh:   9,
	})
	_, _ = g.ActivityAdd(activity.Activity{
		Id:             "C",
		Name:           "Activity C",
		DurationLow:    2,
		DurationLikely: 3,
		DurationHigh:   5,
	})
	_, _ = g.ActivityAdd(activity.Activity{
		Id:             "D",
		Name:           "Activity D",
		DurationLow:    2,
		DurationLikely: 2,
		DurationHigh:   3,
	})
	_, _ = g.ActivityAdd(activity.Activity{
		Id:             "E",
		Name:           "Activity E",
		DurationLow:    3,
		DurationLikely: 3,
		DurationHigh:   4,
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

	graphviz := render.NewGraphviz()
	dot, _ := graphviz.Render(&c)

	return &c, dot
}
