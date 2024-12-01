package render

import (
	"context"
	"github.com/goccy/go-graphviz"
	"quickplan/pkg/cpm"
	"testing"
)

func TestGraphviz_Render(t *testing.T) {
	type args struct {
		c *cpm.Chart
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	g, _ := graphviz.New(context.Background())
	gvz := &Graphviz{g: g}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := gvz.Render(tt.args.c)
			if (err != nil) != tt.wantErr {
				t.Errorf("Render() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("Render() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNewGraphviz(t *testing.T) {
	g := NewGraphviz()
	if g.g == nil {
		t.Fatal("should not have nil pointer for Graphviz.g")
	}
}
