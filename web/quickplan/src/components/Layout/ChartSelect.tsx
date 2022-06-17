import React, {FC, useEffect, useState} from 'react'
import {message, Select} from "antd";
import api from "../../api/api";
import {Routes} from "../../App";
import {useLocation} from "wouter";

export const ChartSelect: FC = () => {
    const [chartIds, chartIdsSet] = useState<string[]>([])
    const [location, setLocation] = useLocation();

    useEffect(() => {
        api.graphList().then((response) => {
            chartIdsSet(response.data)
        }).catch(() => {
            message.error("Could not contact server - is it up?")
        })
    }, [location])

    const onChange = (value: string) => {
        if (!value) {
            return
        }
        setLocation(Routes.specificChart.replace(":chartId", value))
    }

    return (
        <Select onChange={onChange} style={{width: '150px'}}>
            {chartIds.map((id) => {
                return <Select.Option value={id}>{id}</Select.Option>
            })}
        </Select>
    )
}