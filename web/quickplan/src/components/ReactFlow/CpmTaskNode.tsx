import React, {FC, memo} from 'react'
import {Handle, NodeProps, Position} from 'react-flow-renderer'
import {Space} from "antd";

type CpmNodeData = NodeProps<{
    label: string
    description?: string
    cpm: {
        earlyStart: number
        earlyFinish: number
        lateStart: number
        lateFinish: number
        slack: number
    }
}>


const CpmTaskNode: FC<CpmNodeData> = (props) => {
    return (
        <div
            style={{border: '1px solid #bbb', padding: '5px', borderRadius: '5px', background: '#fff'}}>
            <Handle type="target" position={Position.Left} isConnectable/>
            <Space direction="vertical">
                <b>{props.data?.label}</b>
                PLACEHOLDER HERE
            </Space>
            <Handle type="source" position={Position.Right} isConnectable/>
        </div>
    )
}

CpmTaskNode.displayName = 'CpmTaskNode'

export default memo(CpmTaskNode)