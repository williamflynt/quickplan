package activity

import (
	"reflect"
	"testing"
)

func TestActivity_Duration(t *testing.T) {
	type fields struct {
		Id             string
		Name           string
		DurationLow    int
		DurationLikely int
		DurationHigh   int
	}
	tests := []struct {
		name   string
		fields fields
		want   float64
	}{
		{
			"calculates",
			fields{"abc123", "Test Activity", 1, 3, 10},
			3.8},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			a := Activity{
				Id:             tt.fields.Id,
				Name:           tt.fields.Name,
				DurationLow:    tt.fields.DurationLow,
				DurationLikely: tt.fields.DurationLikely,
				DurationHigh:   tt.fields.DurationHigh,
			}
			// Floats are approximate... Our rounding is to the tenth.
			if got := a.Duration(); got-tt.want > 0.001 {
				t.Errorf("Duration() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_Activities(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	tests := []struct {
		name   string
		fields fields
		want   []Activity
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			if got := i.Activities(); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("Activities() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_ActivityAdd(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		activity Activity
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Grapher
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			got, err := i.ActivityAdd(tt.args.activity)
			if (err != nil) != tt.wantErr {
				t.Errorf("ActivityAdd() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ActivityAdd() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_ActivityClone(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		id string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Grapher
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			got, err := i.ActivityClone(tt.args.id)
			if (err != nil) != tt.wantErr {
				t.Errorf("ActivityClone() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ActivityClone() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_ActivityInsertAfter(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		before string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Grapher
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			got, err := i.ActivityInsertAfter(tt.args.before)
			if (err != nil) != tt.wantErr {
				t.Errorf("ActivityInsertAfter() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ActivityInsertAfter() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_ActivityInsertBefore(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		after string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Grapher
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			got, err := i.ActivityInsertBefore(tt.args.after)
			if (err != nil) != tt.wantErr {
				t.Errorf("ActivityInsertBefore() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ActivityInsertBefore() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_ActivityPatch(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		id    string
		attrs map[string]any
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Grapher
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			got, err := i.ActivityPatch(tt.args.id, tt.args.attrs)
			if (err != nil) != tt.wantErr {
				t.Errorf("ActivityPatch() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ActivityPatch() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_ActivityRemove(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		id string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Grapher
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			got, err := i.ActivityRemove(tt.args.id)
			if (err != nil) != tt.wantErr {
				t.Errorf("ActivityRemove() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ActivityRemove() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_ActivityReplace(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		activity Activity
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Grapher
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			got, err := i.ActivityReplace(tt.args.activity)
			if (err != nil) != tt.wantErr {
				t.Errorf("ActivityReplace() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ActivityReplace() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_Dependencies(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	tests := []struct {
		name   string
		fields fields
		want   []Dependency
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			if got := i.Dependencies(); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("Dependencies() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_DependencyAdd(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		firstId string
		nextId  string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Grapher
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			got, err := i.DependencyAdd(tt.args.firstId, tt.args.nextId)
			if (err != nil) != tt.wantErr {
				t.Errorf("DependencyAdd() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("DependencyAdd() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_DependencyRemove(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		firstId string
		nextId  string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Grapher
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			got, err := i.DependencyRemove(tt.args.firstId, tt.args.nextId)
			if (err != nil) != tt.wantErr {
				t.Errorf("DependencyRemove() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("DependencyRemove() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_DependencySplit(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		firstId string
		nextId  string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Grapher
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			got, err := i.DependencySplit(tt.args.firstId, tt.args.nextId)
			if (err != nil) != tt.wantErr {
				t.Errorf("DependencySplit() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("DependencySplit() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_activityClone(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		a     Activity
		newId string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    Activity
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			got, err := i.activityClone(tt.args.a, tt.args.newId)
			if (err != nil) != tt.wantErr {
				t.Errorf("activityClone() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("activityClone() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_generateNewId(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		id string
	}
	tests := []struct {
		name   string
		fields fields
		args   args
		want   string
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			if got := i.generateNewId(tt.args.id); got != tt.want {
				t.Errorf("generateNewId() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestInMemoryGraph_validateIdExists(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		id string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			if err := i.validateIdExists(tt.args.id); (err != nil) != tt.wantErr {
				t.Errorf("validateIdExists() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestInMemoryGraph_validateIdNotBlank(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		id string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			if err := i.validateIdNotBlank(tt.args.id); (err != nil) != tt.wantErr {
				t.Errorf("validateIdNotBlank() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestInMemoryGraph_validateIdNotExists(t *testing.T) {
	type fields struct {
		Name             string
		ActivityMap      map[string]Activity
		DependencyFwdMap map[string][]Dependency
	}
	type args struct {
		id string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			i := &InMemoryGraph{
				Name:             tt.fields.Name,
				ActivityMap:      tt.fields.ActivityMap,
				DependencyFwdMap: tt.fields.DependencyFwdMap,
			}
			if err := i.validateIdNotExists(tt.args.id); (err != nil) != tt.wantErr {
				t.Errorf("validateIdNotExists() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func Test_popFromSlice(t *testing.T) {
	type args struct {
		s   []int
		idx int
	}
	tests := []struct {
		name string
		args args
		want []int
	}{{
		name: "pops correctly",
		args: args{
			s:   []int{1, 2, 3, 4},
			idx: 1,
		},
		want: []int{1, 3, 4},
	}}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := popFromSlice(tt.args.s, tt.args.idx); len(got) != len(tt.want) {
				t.Errorf("popFromSlice() = %v, want %v", got, tt.want)
			}
		})
	}
}
