import React, {FC, useEffect} from 'react'
import api from "../../api/api";
import {Flow} from "./Flow";
import {SetupChart} from "./SetupChart";

export const FlowBasicExample: FC = () => {

    useEffect(() => {
        api.graphExample().then((response) => {
                SetupChart(response.data)
            }
        )
    }, [])

    return <Flow/>
}
