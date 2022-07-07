package util

import (
	"encoding/json"
	"quickplan/pkg/activity"
	"testing"
)

func TestChartFromCsv(t *testing.T) {
	caseOne := `id,name,description,durationLow,durationLikely,durationHigh,dependsOn,x,y,duration,criticalPath,meta
END,End,,0,0,0,FIRSTTASK|START,282.19,82.60,0.00,true,{}
FIRSTTASK,My Title,My Description,0,0,0,START,192.19,59.60,0.00,true,{}
START,Start,,0,0,0,,102.19,82.60,0.00,false,{}`
	caseOneGraphJson := `{"id":"0xc000114150","name":"New Graph","activityMap":{"END":{"id":"END","name":"End","description":"","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{"FIRSTTASK":{"id":"FIRSTTASK","name":"My Title","description":"My Description","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{"START":{"id":"START","name":"Start","description":"","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{}}}},"START":{"id":"START","name":"Start","description":"","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{}}}},"FIRSTTASK":{"id":"FIRSTTASK","name":"My Title","description":"My Description","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{"START":{"id":"START","name":"Start","description":"","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{}}}},"START":{"id":"START","name":"Start","description":"","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{}}}}`
	caseOneGraph := new(activity.InMemoryGraph)
	_ = json.Unmarshal([]byte(caseOneGraphJson), caseOneGraph)

	tests := []struct {
		name    string
		data    string // data is the CSV string.
		want    activity.InMemoryGraph
		wantErr bool
	}{
		{"Three Node Graph", caseOne, *caseOneGraph, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ChartFromCsv([]byte(tt.data))
			if (err != nil) != tt.wantErr {
				t.Errorf("ChartFromCsv() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			activities := make(map[string]*activity.Activity)
			for _, x := range got.Activities() {
				z := x
				activities[x.Id] = &z
			}
			for k, v := range tt.want.ActivityMap {
				if activities[k].Id != v.Id ||
					activities[k].Name != v.Name ||
					activities[k].Descr != v.Descr ||
					activities[k].DurationLow != v.DurationLow ||
					activities[k].DurationLikely != v.DurationLikely ||
					activities[k].DurationHigh != v.DurationHigh {
					t.Errorf("Activities Error - not matching for key %s", k)
					return
				}
			}
		})
	}
}
