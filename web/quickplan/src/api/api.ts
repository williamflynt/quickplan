import axios, { AxiosResponse } from 'axios'
import { Chart } from './types'

const BASE_URL = 'http://localhost:3535'

class Api {
  baseUrl: string = BASE_URL

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl
    }
  }

  private url(path: string): string {
    if (!path.startsWith('/')) {
      path = '/' + path
    }
    return `${this.baseUrl}${path}`
  }

  async baseHealthcheck(): Promise<AxiosResponse> {
    return axios.get(this.url('/healthcheck'))
  }

  // --- GRAPH ---

  async graphList(): Promise<AxiosResponse<string[]>> {
    return axios.get(this.url(`/api/v1/graph/`))
  }

  async graphExample(): Promise<AxiosResponse<Chart>> {
    return axios.get(this.url(`/api/v1/graph/example`))
  }

  async graphLoad(chartJson: string): Promise<AxiosResponse<Chart>> {
    const headers = { 'Content-Type': 'application/json' }
    return axios.post(this.url(`/api/v1/graph/load`), chartJson, { headers })
  }

  async graphNew(): Promise<AxiosResponse<Chart>> {
    return axios.get(this.url(`/api/v1/graph/new`))
  }

  async graphNewFromCsv(chartCsv: string): Promise<AxiosResponse<Chart>> {
    const headers = { 'Content-Type': 'text/csv' }
    return axios.post(this.url(`/api/v1/graph/new/csv`), chartCsv, { headers })
  }

  async graphGet(id: string): Promise<AxiosResponse<Chart>> {
    return axios.get(this.url(`/api/v1/graph/${id}`))
  }

  async graphDelete(id: string): Promise<AxiosResponse> {
    return axios.delete(this.url(`/api/v1/graph/${id}`))
  }

  async graphSetLabel(id: string, label: string): Promise<AxiosResponse> {
    return axios.post(this.url(`/api/v1/graph/${id}/label/${label}`))
  }

  // --- ACTIVITY / NODE ---

  async graphActivityNew(
    graphId: string,
    activityJson: string
  ): Promise<AxiosResponse<Chart>> {
    const headers = { 'Content-Type': 'application/json' }
    return axios.post(
      this.url(`/api/v1/graph/${graphId}/activities/`),
      activityJson,
      { headers }
    )
  }

  async graphActivityPatch(
    graphId: string,
    activityId: string,
    patchJson: string
  ): Promise<AxiosResponse<Chart>> {
    const headers = { 'Content-Type': 'application/json' }
    return axios.patch(
      this.url(`/api/v1/graph/${graphId}/activities/${activityId}`),
      patchJson,
      { headers }
    )
  }

  async graphActivityDelete(
    graphId: string,
    activityId: string
  ): Promise<AxiosResponse<Chart>> {
    return axios.delete(
      this.url(`/api/v1/graph/${graphId}/activities/${activityId}`)
    )
  }

  async graphActivityClone(
    graphId: string,
    activityId: string
  ): Promise<AxiosResponse<Chart>> {
    const headers = { 'Content-Type': 'application/json' }
    return axios.post(
      this.url(`/api/v1/graph/${graphId}/activities/${activityId}/clone`),
      undefined,
      { headers }
    )
  }

  async graphActivityInsertBefore(
    graphId: string,
    activityId: string
  ): Promise<AxiosResponse<Chart>> {
    return axios.post(
      this.url(
        `/api/v1/graph/${graphId}/activities/${activityId}/insert/before`
      ),
      undefined
    )
  }

  async graphActivityInsertAfter(
    graphId: string,
    activityId: string
  ): Promise<AxiosResponse<Chart>> {
    return axios.post(
      this.url(
        `/api/v1/graph/${graphId}/activities/${activityId}/insert/after`
      ),
      undefined
    )
  }

  // --- DEPENDENCY / ARROW / EDGE ---

  async graphDependencyNew(
    graphId: string,
    depJson: string
  ): Promise<AxiosResponse<Chart>> {
    const headers = { 'Content-Type': 'application/json' }
    return axios.post(
      this.url(`/api/v1/graph/${graphId}/dependencies`),
      depJson,
      { headers }
    )
  }

  async graphDependencyDelete(
    graphId: string,
    depJson: string
  ): Promise<AxiosResponse<Chart>> {
    const headers = { 'Content-Type': 'application/json' }
    return axios.delete(this.url(`/api/v1/graph/${graphId}/dependencies`), {
      headers,
      data: depJson,
    })
  }

  async graphDependencySplit(
    graphId: string,
    depJson: string
  ): Promise<AxiosResponse<Chart>> {
    const headers = { 'Content-Type': 'application/json' }
    return axios.post(
      this.url(`/api/v1/graph/${graphId}/dependencies/split`),
      depJson,
      { headers }
    )
  }

  // --- EXPORTS ---

  async graphExportsCsv(id: string): Promise<AxiosResponse> {
    return axios.get(this.url(`/api/v1/graph/${id}/exports/csv`), {
      responseType: 'blob',
    })
  }

  async graphExportsDot(id: string): Promise<AxiosResponse> {
    return axios.get(this.url(`/api/v1/graph/${id}/exports/dot`), {
      responseType: 'blob',
    })
  }

  async graphExportsJson(id: string): Promise<AxiosResponse> {
    return axios.get(this.url(`/api/v1/graph/${id}/exports/json`), {
      responseType: 'blob',
    })
  }
}

const singleton = new Api()

export default singleton
