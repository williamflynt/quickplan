package server

import (
	"encoding/json"
	"github.com/go-chi/chi"
	"github.com/rs/zerolog/log"
	"io/ioutil"
	"net/http"
	"quickplan/examples"
	"quickplan/internal/render"
	"quickplan/internal/util"
	"quickplan/pkg/activity"
)

// --- GRAPH HANDLERS ---

func (s *Server) graphList(w http.ResponseWriter, r *http.Request) {
	ids := s.GraphStore.List()
	w.WriteHeader(200)
	b, err := json.Marshal(ids)
	if err != nil {
		log.Error().Err(err).Msg("error marshaling graph ids")
	}
	_, _ = w.Write(b)
}

// graphLoad accepts JSON of a cpm.Chart and deserializes to an activity.InMemoryGraph.
// Then, it saves the Graph in the server-local GraphStore.
// Finally, it returns the Chart as JSON to the caller.
func (s *Server) graphLoad(w http.ResponseWriter, r *http.Request) {
	chartData, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(400)
		return
	}

	g, err := util.ChartJsonToGraph(chartData)
	if err != nil {
		w.WriteHeader(400)
		log.Error().Err(err).Msg("could not transform chart JSON to Graph")
		return
	}
	if _, err := s.GraphStore.Save(g); err != nil {
		log.Error().Err(err).Msg("error saving newly loaded Graph to store")
		w.WriteHeader(500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	_, _ = w.Write(chartData)
}

func (s *Server) graphNew(w http.ResponseWriter, r *http.Request) {
	g := activity.NewInMemoryGraph()
	g.LabelSet("New Graph")
	_, err := s.GraphStore.Save(&g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not save Graph to GraphStore")
		return
	}
	b, err := util.GraphToChartJson(&g)
	if err != nil {
		w.WriteHeader(500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)
	_, _ = w.Write(b)
}

func (s *Server) graphNewFromCsv(w http.ResponseWriter, r *http.Request) {
	graphData, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(400)
		return
	}

	g, err := util.ChartFromCsv(graphData)
	if err != nil {
		w.WriteHeader(400)
		log.Error().Err(err).Msg("could not transform CSV to Graph")
		return
	}
	if _, err := s.GraphStore.Save(g); err != nil {
		log.Error().Err(err).Msg("error saving newly loaded Graph to store")
		w.WriteHeader(500)
		return
	}

	chartData, err := util.GraphToChartJson(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not get Chart from Graph")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)
	_, _ = w.Write(chartData)
}

func (s *Server) graphGet(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}
	chartJson, err := util.GraphToChartJson(g)
	if err != nil {
		w.WriteHeader(500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	_, _ = w.Write(chartJson)
}

func (s *Server) graphDelete(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	s.GraphStore.Delete(graphId)
	w.WriteHeader(204)
}

func (s *Server) graphSetLabel(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	graphName := chi.URLParam(r, "label")
	if graphName == "" {
		w.WriteHeader(400)
		return
	}
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}
	g.LabelSet(graphName)
	_, err = s.GraphStore.Save(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not save Graph to GraphStore")
		return
	}
	w.WriteHeader(200)
}

func (s *Server) graphActivityNew(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}
	decoder := json.NewDecoder(r.Body)
	a := new(activity.Activity)
	if err := decoder.Decode(a); err != nil {
		w.WriteHeader(400)
		log.Info().Err(err).Msg("improper body for Activity")
		return
	}
	if _, err := g.ActivityAdd(*a); err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not add Activity to graph")
		return
	}
	_, err = s.GraphStore.Save(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not save Graph to GraphStore")
		return
	}
	data, err := util.GraphToChartJson(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not convert Graph to Chart")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)
	_, _ = w.Write(data)
}

func (s *Server) graphActivityPatch(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	activityId := chi.URLParam(r, "activityId")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}

	m := make(map[string]any)
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&m); err != nil {
		w.WriteHeader(400)
		log.Warn().Err(err).Msg("could not unmarshal JSON to patch map")
		return
	}

	if _, err := g.ActivityPatch(activityId, m); err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not patch Activity")
		return
	}
	_, err = s.GraphStore.Save(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not save Graph to GraphStore")
		return
	}

	data, err := util.GraphToChartJson(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not convert Graph to Chart")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	_, _ = w.Write(data)
}

func (s *Server) graphActivityDelete(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}
	activityId := chi.URLParam(r, "activityId")
	if _, err = g.ActivityRemove(activityId); err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not delete Activity")
	}
	_, err = s.GraphStore.Save(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not save Graph to GraphStore")
		return
	}

	data, err := util.GraphToChartJson(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not convert Graph to Chart")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	_, _ = w.Write(data)
}

func (s *Server) graphActivityClone(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	activityId := chi.URLParam(r, "activityId")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}

	if _, err := g.ActivityClone(activityId); err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not insert Activity before existing")
		return
	}
	_, err = s.GraphStore.Save(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not save Graph to GraphStore")
		return
	}

	data, err := util.GraphToChartJson(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not convert Graph to Chart")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)
	_, _ = w.Write(data)
}

func (s *Server) graphActivityInsertBefore(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	activityId := chi.URLParam(r, "activityId")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}

	if _, err := g.ActivityInsertBefore(activityId); err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not insert Activity before existing")
		return
	}
	_, err = s.GraphStore.Save(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not save Graph to GraphStore")
		return
	}

	data, err := util.GraphToChartJson(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not convert Graph to Chart")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)
	_, _ = w.Write(data)
}

func (s *Server) graphActivityInsertAfter(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	activityId := chi.URLParam(r, "activityId")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}

	if _, err := g.ActivityInsertAfter(activityId); err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not insert Activity after existing")
		return
	}
	_, err = s.GraphStore.Save(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not save Graph to GraphStore")
		return
	}

	data, err := util.GraphToChartJson(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not convert Graph to Chart")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)
	_, _ = w.Write(data)
}

func (s *Server) graphDependencyNew(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}
	decoder := json.NewDecoder(r.Body)
	d := new(activity.Dependency)
	if err := decoder.Decode(d); err != nil || d.FirstId == "" || d.NextId == "" {
		w.WriteHeader(400)
		log.Info().Err(err).Str("firstId", d.FirstId).Str("nextId", d.NextId).Msg("improper body for Dependency")
		return
	}
	if _, err := g.DependencyAdd(d.FirstId, d.NextId); err != nil {
		w.WriteHeader(400)
		log.Error().Err(err).Msg("could not add Dependency to Graph")
		return
	}
	_, err = s.GraphStore.Save(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not save Graph to GraphStore")
		return
	}

	data, err := util.GraphToChartJson(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not convert Graph to Chart")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)
	_, _ = w.Write(data)
}

func (s *Server) graphDependencyDelete(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}
	decoder := json.NewDecoder(r.Body)
	d := new(activity.Dependency)
	if err := decoder.Decode(d); err != nil || d.FirstId == "" || d.NextId == "" {
		w.WriteHeader(400)
		log.Info().Err(err).Str("firstId", d.FirstId).Str("nextId", d.NextId).Msg("improper body for Dependency")
		return
	}
	if _, err := g.DependencyRemove(d.FirstId, d.NextId); err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not remove Dependency from Graph")
		return
	}
	_, err = s.GraphStore.Save(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not save Graph to GraphStore")
		return
	}

	data, err := util.GraphToChartJson(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not convert Graph to Chart")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)
	_, _ = w.Write(data)
}

// graphDependencySplit accepts an activity.Dependency as JSON and splits it with a new activity.Activity.
func (s *Server) graphDependencySplit(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}

	decoder := json.NewDecoder(r.Body)
	d := new(activity.Dependency)
	if err := decoder.Decode(d); err != nil || d.FirstId == "" || d.NextId == "" {
		w.WriteHeader(400)
		log.Info().Err(err).Str("firstId", d.FirstId).Str("nextId", d.NextId).Msg("improper body for Dependency")
		return
	}

	if _, err := g.DependencySplit(d.FirstId, d.NextId); err != nil {
		w.WriteHeader(400)
		log.Error().Err(err).Msg("could not split dependency - does it exist?")
		return
	}
	_, err = s.GraphStore.Save(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not save Graph to GraphStore")
		return
	}

	data, err := util.GraphToChartJson(g)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not convert Graph to Chart")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)
	_, _ = w.Write(data)
}

func (s *Server) graphExportCsv(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}
	c := util.GraphToChart(g)
	writer := render.CsvWriter{}
	data, err := writer.Render(&c)
	if err != nil {
		w.WriteHeader(500)
		log.Error().Err(err).Msg("could not export to CSV")
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.WriteHeader(200)
	_, _ = w.Write([]byte(data))
}

func (s *Server) graphExportJson(w http.ResponseWriter, r *http.Request) {
	s.graphGet(w, r)
}

func (s *Server) graphExportDot(w http.ResponseWriter, r *http.Request) {
	graphId := chi.URLParam(r, "id")
	g, err := s.GraphStore.Load(graphId)
	if g == nil {
		w.WriteHeader(404)
		return
	}
	if err != nil {
		w.WriteHeader(500)
		return
	}
	c := util.GraphToChart(g)
	graphviz := render.NewGraphviz()
	dot, err := graphviz.Render(&c)
	if err != nil {
		w.WriteHeader(500)
		return
	}
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(200)
	_, _ = w.Write([]byte(dot))
}

// --- SYSTEM HANDLERS ---

func (s *Server) healthcheckHandlerFunc(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(200)
	_, _ = w.Write([]byte("ok"))
}

func (s *Server) exampleChartHandlerFunc(w http.ResponseWriter, r *http.Request) {
	c := examples.Basic()
	b, err := json.Marshal(c)
	if err != nil {
		w.WriteHeader(500)
		_, _ = w.Write([]byte(err.Error()))
		log.Error().Err(err).Msg("failed to unmarshal Chart in example handler")
		return
	}
	w.WriteHeader(200)
	_, _ = w.Write(b)
}
