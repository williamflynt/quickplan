import axios from "axios";
import {ChartExample} from "./types";

const BASE_URL = 'http://localhost:3535'

class Api {
    baseUrl: string = BASE_URL

    constructor(baseUrl?: string) {
        if (baseUrl) {
            this.baseUrl = baseUrl
        }
    }

    async getExampleBasic() {
        return axios.get<ChartExample>(`${this.baseUrl}/api/v1/graph/example`)
    }

}

const singleton = new Api()

export default singleton