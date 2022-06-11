package examples

import (
	"quickplan/pkg/activity"
	"quickplan/pkg/cpm"
)

func Basic() *cpm.Chart {
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

	activities := g.Activities()
	aPtrs := make([]cpm.Task, len(activities))
	for _, a := range activities {
		aPtrs = append(aPtrs, &a)
	}
	c, _ := cpm.Calculate(aPtrs)
	return &c
}
