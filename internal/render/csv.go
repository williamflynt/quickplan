package render

import "quickplan/pkg/cpm"

type CsvWriter struct {
	Delim string
}

func (cw *CsvWriter) Render(*cpm.Chart) (string, error) {
	return "", nil
}
