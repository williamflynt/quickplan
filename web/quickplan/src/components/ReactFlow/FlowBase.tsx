import React, {FC, useEffect, useState} from 'react'
import api from "../../api/api";
import {Flow} from "./Flow";
import {useReactFlow} from "react-flow-renderer";
import {useStore} from "../../store/store";
import {SetupChart} from "./SetupChart";
import {AxiosError} from "axios";
import {message, notification} from "antd";

export const FlowBase: FC = () => {
    const {setNodes, setEdges} = useReactFlow()
    const {activeChartId} = useStore()

    useEffect(() => {
        if (activeChartId === null) {
            api.graphNew().then((response) => {
                SetupChart(response.data, setNodes, setEdges)
                useStore.setState({activeChartId: response.data.id, nodeToolsVisible: true})
                if (response.data.nodes?.length) {
                    useStore.setState({activeNodeId: response.data.nodes[0].id})
                }
                message.success("Created a new Chart")
            })
            return
        }
        api.graphGet(activeChartId).then((response) => {
            SetupChart(response.data, setNodes, setEdges)
            useStore.setState({nodeToolsVisible: true})
            if (response.data.nodes?.length) {
                useStore.setState({activeNodeId: response.data.nodes[0].id})
            }
        }).catch((err: AxiosError) => {
            if (err.response) {
                if (err.response.status === 404) {
                    notification.warning({
                        message: `Not Found - Chart ${activeChartId}`,
                        description: "We don't have that Chart! You can load it with a saved JSON file using the 'Load JSON' button at the top.",
                        duration: 3,
                    })
                    setNodes([])
                    setEdges([])
                    useStore.setState({activeChartId: null, activeNodeId: null, nodeToolsVisible: false})
                }
            }
        })
    }, [activeChartId])

    return <Flow/>
}
