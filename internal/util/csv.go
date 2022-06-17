package util

import (
	"bytes"
	"encoding/csv"
	"github.com/cockroachdb/errors"
	"github.com/rs/zerolog/log"
	"quickplan/pkg/activity"
	"strconv"
	"strings"
)

func ChartFromCsv(data []byte) (activity.Graph, error) {
	bufReader := bytes.NewReader(data)
	reader := csv.NewReader(bufReader)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}
	headerTemplate := []string{"id", "name", "description", "durationLow", "durationLikely", "durationHigh"}
	if len(records) < 1 {
		return nil, errors.New("no data in CSV")
	}
	if len(records) < 2 {
		return nil, errors.New("need CSV header and data")
	}
	if len(headerTemplate) != len(records[0]) {
		return nil, errors.Newf("header must match template '%s'", strings.Join(headerTemplate, ","))
	}
	for i := range headerTemplate {
		if records[0][i] != headerTemplate[i] {
			return nil, errors.Newf("header must match template '%s'", strings.Join(headerTemplate, ","))
		}
	}

	g := activity.NewInMemoryGraph("New Graph")

	for _, vals := range records[1:] {
		dLo, err := strconv.Atoi(vals[3])
		if err != nil {
			log.Error().Err(err).Str("val", vals[3]).Msg("got bad durationLow - skipping")
			continue
		}
		dLi, err := strconv.Atoi(vals[4])
		if err != nil {
			log.Error().Err(err).Str("val", vals[3]).Msg("got bad durationLikely - skipping")
			continue
		}
		dHi, err := strconv.Atoi(vals[5])
		if err != nil {
			log.Error().Err(err).Str("val", vals[3]).Msg("got bad durationHigh - skipping")
			continue
		}
		a := activity.Activity{
			Id:             vals[0],
			Name:           vals[1],
			Descr:          vals[2],
			DurationLow:    dLo,
			DurationLikely: dLi,
			DurationHigh:   dHi,
			DependsOn:      make(map[string]*activity.Activity),
		}
		_, err = g.ActivityAdd(a)
		if err != nil {
			log.Error().Err(err).Str("id", vals[0]).Msg("failed to add Activity - skipping")
		}
	}

	return &g, nil
}
