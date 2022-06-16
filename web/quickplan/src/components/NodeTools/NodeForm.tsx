import React, {FC} from 'react'
import {Button, Form, Input, InputNumber, notification} from "antd";
import {CpmNodeType} from "../ReactFlow/CpmTaskNode";
import {useStore} from "../../store/store";
import api from "../../api/api";
import {AxiosError} from "axios";
import {SetupChart} from "../ReactFlow/SetupChart";

type NodeFormProps = {
    node: CpmNodeType | null
}


export const NodeForm: FC<NodeFormProps> = ({node}) => {
    const {activeChartId} = useStore()

    if (!node || !activeChartId) {
        return <></>
    }

    const onFinish = (values: Record<string, unknown>) => {
        const asStr = JSON.stringify(values)
        api.graphActivityPatch(activeChartId, node.id, asStr).then((response) => {
            SetupChart(response.data)
        }).catch((err: AxiosError) => {
            notification.error({
                message: "Could not save updates to Activity",
                description: `Got status ${err.response?.status} from server.`,
                duration: 3
            })
        })
    };

    const onFinishFailed = (errorInfo: unknown) => {
        notification.error({
            message: "Did not save updates to Activity",
            description: JSON.stringify(errorInfo),
            duration: 3
        })
    };

    return (
        <Form onFinish={onFinish} onFinishFailed={onFinishFailed} key={node.id}>
            <Form.Item name="name" label={"Title"} initialValue={undefined}>
                <Input placeholder={node.data.label}/>
            </Form.Item>
            <Form.Item name="description" label={"Description"} initialValue={undefined}>
                <Input placeholder={node.data.description}/>
            </Form.Item>
            <Form.Item name={"durationLow"} label={"DurationLow"} initialValue={undefined}>
                <InputNumber style={{width: '100%'}} placeholder={node.data.cpm.durationLow.toString()}/>
            </Form.Item>
            <Form.Item name={"durationLikely"} label={"DurationLikely"} initialValue={undefined}>
                <InputNumber style={{width: '100%'}} placeholder={node.data.cpm.durationLikely.toString()}/>
            </Form.Item>
            <Form.Item name="durationHigh" label={"DurationHigh"} initialValue={undefined}>
                <InputNumber style={{width: '100%'}} placeholder={node.data.cpm.durationHigh.toString()}/>
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit">Save Changes</Button>
            </Form.Item>
        </Form>
    )
}