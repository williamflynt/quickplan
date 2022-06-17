import React, {FC, useEffect} from 'react'
import api from "../../api/api";
import {Flow} from "./Flow";
import {SetupChart} from "./SetupChart";
import {useStore} from "../../store/store";
import {message} from "antd";

export const FlowSpecificChart: FC<{id: string}> = ({id}) => {

    useEffect(() => {
        api.graphGet(id).then((response) => {
            useStore.setState({activeChartId: id})
            SetupChart(response.data, true)
            }
        ).catch(() => {
            message.error(`No matching Chart with id '${id}'`)
        })
    }, [id])

    return <Flow/>
}
