package util

import (
	"encoding/json"
	"quickplan/pkg/activity"
	"reflect"
	"testing"
)

func TestChartJsonToGraph(t *testing.T) {
	caseOne := `{"nodes":[{"id":"START","title":"Start","description":"","meta":{},"position":{"x":102.19,"y":59.6},"duration":0,"durationLow":0,"durationLikely":0,"durationHigh":0,"label":"","earliestStart":0,"earliestFinish":0,"latestStart":0,"latestFinish":0,"slack":0},{"id":"END","title":"End","description":"","meta":{},"position":{"x":282.19,"y":59.6},"duration":0,"durationLow":0,"durationLikely":0,"durationHigh":0,"label":"","earliestStart":0,"earliestFinish":0,"latestStart":0,"latestFinish":0,"slack":0},{"id":"FIRSTTASK","title":"My Title","description":"My Description","meta":{},"position":{"x":192.19,"y":59.6},"duration":0,"durationLow":0,"durationLikely":0,"durationHigh":0,"label":"","earliestStart":0,"earliestFinish":0,"latestStart":0,"latestFinish":0,"slack":0}],"arrows":[{"id":"FIRSTTASK-\u003eEND","from":"FIRSTTASK","to":"END","criticalPath":true},{"id":"START-\u003eFIRSTTASK","from":"START","to":"FIRSTTASK","criticalPath":true}],"id":"0xc000114150","title":"New Graph"}`
	caseOneGraphJson := `{"id":"0xc000114150","name":"New Graph","activityMap":{"END":{"id":"END","name":"End","description":"","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{"FIRSTTASK":{"id":"FIRSTTASK","name":"My Title","description":"My Description","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{"START":{"id":"START","name":"Start","description":"","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{}}}},"START":{"id":"START","name":"Start","description":"","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{}}}},"FIRSTTASK":{"id":"FIRSTTASK","name":"My Title","description":"My Description","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{"START":{"id":"START","name":"Start","description":"","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{}}}},"START":{"id":"START","name":"Start","description":"","durationLow":0,"durationLikely":0,"durationHigh":0,"dependsOn":{}}}}`
	caseOneGraph := new(activity.InMemoryGraph)
	_ = json.Unmarshal([]byte(caseOneGraphJson), caseOneGraph)

	tests := []struct {
		name    string
		data    string // data is the JSON string.
		want    activity.Graph
		wantErr bool // wantErr indicates if we expect an error for this case.
	}{
		{name: "Three Node Graph", data: caseOne, want: caseOneGraph, wantErr: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ChartJsonToGraph([]byte(tt.data))
			if (err != nil) != tt.wantErr {
				t.Errorf("ChartJsonToGraph() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ChartJsonToGraph() got = %v, want %v", got, tt.want)
			}
		})
	}
}
