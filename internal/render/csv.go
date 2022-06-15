package render

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"github.com/cockroachdb/errors"
	"quickplan/pkg/cpm"
	"strconv"
	"strings"
)

type CsvWriter struct{}

func (cw *CsvWriter) Render(c *cpm.Chart) (string, error) {
	if c == nil {
		return "", errors.New("cannot export nil Chart")
	}
	var data = [][]string{
		{"Id", "Title", "Description", "Duration", "DurationLow", "DurationLikely", "DurationHigh", "X", "Y", "DependsOn", "CriticalPath", "Meta"},
	}

	for _, n := range c.Nodes {
		row := nodeToRow(n, c.Arrows)
		data = append(data, row)
	}

	buf := strings.Builder{}
	writer := csv.NewWriter(&buf)
	err := writer.WriteAll(data)
	return buf.String(), err
}

func nodeToRow(n *cpm.Node, arrows []cpm.Arrow) []string {
	//	{"Id", "Title", "Description", "Duration", "DurationLow", "DurationLikely", "DurationHigh", "X", "Y", "DependsOn", "CriticalPath", "Meta"},
	deps, crit := depsCritForNode(n.Id, arrows)
	meta := metaForNode(*n)
	row := make([]string, 12)
	row[0] = n.Id
	row[1] = n.Title
	row[2] = n.Description
	row[3] = fmt.Sprintf(`%.2f`, n.Duration)
	row[4] = strconv.Itoa(n.DurationLow)
	row[5] = strconv.Itoa(n.DurationLikely)
	row[6] = strconv.Itoa(n.DurationHigh)
	row[7] = fmt.Sprintf(`%.2f`, n.Position.X)
	row[8] = fmt.Sprintf(`%.2f`, n.Position.Y)
	row[9] = deps
	row[10] = strconv.FormatBool(crit)
	row[11] = meta
	return row
}

func depsCritForNode(id string, arrows []cpm.Arrow) (string, bool) {
	deps := make([]string, 0)
	crit := false

	for _, a := range arrows {
		if a.To == id {
			deps = append(deps, a.From)
			if a.CriticalPath {
				crit = true
			}
		}
	}

	return strings.Join(deps, "|"), crit
}

func metaForNode(n cpm.Node) string {
	b, _ := json.Marshal(n.Meta)
	return string(b)
}
