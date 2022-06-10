package config

import (
	"os"
	"reflect"
	"testing"
)

func TestConfigure(t *testing.T) {
	tests := []struct {
		appEnv AppEnvValue
		name   string
		want   Options
	}{
		{Local, "loads local yml", Options{ApplicationEnvironment: Local, Port: 3535}},
		{Staging, "loads staging yml", Options{ApplicationEnvironment: Staging, Port: 3535}},
		{Production, "loads production yml", Options{ApplicationEnvironment: Production, Port: 3535}},
		{"", "loads local yml default", Options{ApplicationEnvironment: Local, Port: 3535}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_ = os.Setenv("APPLICATION_ENVIRONMENT", string(tt.appEnv))
			if got := Configure(); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("Configure() = %v, want %v", got, tt.want)
			}
		})
	}
}
