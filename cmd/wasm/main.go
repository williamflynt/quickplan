//go:build js && wasm

package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"syscall/js"

	"quickplan/pkg/cpm"
)

// jsTask implements cpm.Task with JSON-friendly fields.
type jsTask struct {
	Uid_           string            `json:"uid"`
	Title_         string            `json:"title"`
	Description_   string            `json:"description"`
	Meta_          map[string]string `json:"meta"`
	DurationLow    int               `json:"durationLow"`
	DurationLikely int               `json:"durationLikely"`
	DurationHigh   int               `json:"durationHigh"`
	Predecessors_  []string          `json:"predecessors"`
}

func (t *jsTask) Uid() string             { return t.Uid_ }
func (t *jsTask) Title() string           { return t.Title_ }
func (t *jsTask) Description() string     { return t.Description_ }
func (t *jsTask) Meta() map[string]string { return t.Meta_ }
func (t *jsTask) Duration() float64       { return float64(t.DurationLikely) }
func (t *jsTask) DurationL() int          { return t.DurationLow }
func (t *jsTask) DurationM() int          { return t.DurationLikely }
func (t *jsTask) DurationH() int          { return t.DurationHigh }
func (t *jsTask) Predecessors() []string  { return t.Predecessors_ }

// parseTasks converts the JS array into a slice of cpm.Task with error checks.
func parseTasks(jsValue js.Value) ([]cpm.Task, error) {
	var tasks []cpm.Task
	length := jsValue.Length()
	for i := 0; i < length; i++ {
		raw := jsValue.Index(i)
		if raw.IsUndefined() || raw.IsNull() {
			return nil, fmt.Errorf("task at index %d is null or undefined", i)
		}
		serialized := raw.String() // Expecting a JSON string from JS.
		var jt jsTask
		if err := json.Unmarshal([]byte(serialized), &jt); err != nil {
			return nil, fmt.Errorf("cannot parse task at index %d: %v", i, err)
		}
		if err := validateTask(jt); err != nil {
			return nil, fmt.Errorf("validation failed for task at index %d: %w", i, err)
		}
		tasks = append(tasks, &jt)
	}
	return tasks, nil
}

func validateTask(t jsTask) error {
	if t.Uid_ == "" {
		return errors.New("missing uid")
	}
	if t.Title_ == "" {
		return errors.New("missing title")
	}
	if t.DurationLow < 0 || t.DurationLikely < 0 || t.DurationHigh < 0 {
		return errors.New("durations must be non-negative")
	}
	if t.DurationLow > t.DurationLikely || t.DurationLikely > t.DurationHigh {
		return errors.New("durations must satisfy low <= likely <= high")
	}
	return nil
}

// runCpm is the WASM-exported function JavaScript will call to calculate CPM numbers.
func runCpm(_this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return map[string]interface{}{
			"error": "no tasks array provided",
		}
	}

	tasks, err := parseTasks(args[0])
	if err != nil {
		return map[string]interface{}{
			"error": fmt.Sprintf("failed to parse tasks: %v", err),
		}
	}

	chart, calcErr := cpm.Calculate(tasks)
	if calcErr != nil {
		return map[string]interface{}{
			"error": calcErr.Error(),
		}
	}

	// Convert cpm.Chart to JSON for JS consumption.
	data, _ := json.Marshal(chart)
	return map[string]interface{}{
		"error": "",
		"chart": string(data),
	}
}

func main() {
	js.Global().Set("Calculate", js.FuncOf(runCpm))
	// Keep Go/WASM running by blocking on a channel read.
	select {}
}
