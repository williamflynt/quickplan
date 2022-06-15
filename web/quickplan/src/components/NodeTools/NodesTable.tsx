import React, {FC} from "react";
import {useStore} from "../../store/store";
import {CpmNodeType} from "../ReactFlow/CpmTaskNode";
import {Table, Typography} from "antd";

export const NodesTable: FC = () => {
    const {activeNodeId, nodes} = useStore()

    const columns = [
        {
            title: 'Id',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => {
                if (id === activeNodeId) {
                    return <Typography.Text strong>{id}</Typography.Text>
                }
                return id
            }
        },
        {
            title: 'Title',
            dataIndex: ['data', 'label'],
            key: 'title',
        },
        {
            title: 'Description',
            dataIndex: ['data', 'description'],
            key: 'description',
        },
        {
            title: 'Duration',
            dataIndex: ['data', 'cpm', 'duration'],
            key: 'cpm.duration',
        },
        {
            title: 'Duration Low',
            dataIndex: ['data', 'cpm', 'duration'],
            key: 'cpm.durationLow',
        },
        {
            title: 'Duration Likely',
            dataIndex: ['data', 'cpm', 'duration'],
            key: 'cpm.durationLikely',
        },
        {
            title: 'Duration High',
            dataIndex: ['data', 'cpm', 'duration'],
            key: 'cpm.durationHigh',
        },
        {
            title: 'Update',
            render: (node: CpmNodeType) => {
                return <Typography.Link>Edit</Typography.Link>
            }
        },
    ]

    return <Table dataSource={nodes} columns={columns} size="small"/>
}