import React, {FC} from 'react'
import {Button, Form, Input, InputNumber} from "antd";
import {CpmNodeType} from "../ReactFlow/CpmTaskNode";
import {useStore} from "../../store/store";

type NodeFormProps = {
    node: CpmNodeType | null
}


export const NodeForm: FC<NodeFormProps> = ({node}) => {
    const {activeChartId} = useStore()
    const [form] = Form.useForm();


    if (!node || !activeChartId) {
        return <></>
    }

    return (
        <Form form={form}>
            <Form.Item label={"Title"}>
                <Input placeholder={node.data.label}/>
            </Form.Item>
            <Form.Item label={"Description"}>
                <Input placeholder={node.data.description}/>
            </Form.Item>
            <Form.Item label={"DurationLow"}>
                <InputNumber style={{width: '100%'}} placeholder={node.data.cpm.durationLow.toString()}/>
            </Form.Item>
            <Form.Item label={"DurationLikely"}>
                <InputNumber style={{width: '100%'}} placeholder={node.data.cpm.durationLikely.toString()}/>
            </Form.Item>
            <Form.Item label={"DurationHigh"}>
                <InputNumber style={{width: '100%'}} placeholder={node.data.cpm.durationHigh.toString()}/>
            </Form.Item>

            <Form.Item>
                <Button type="primary">Save Changes</Button>
            </Form.Item>
        </Form>
    )
}