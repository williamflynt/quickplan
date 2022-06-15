import React, {FC} from 'react'
import {Button, Divider, Drawer, Space, Table} from "antd";
import {useStore} from "../../store/store";
import {Node} from "react-flow-renderer";
import {CpmNodeData} from "./CpmTaskNode";

export const NodesTable: FC = () => {
    const {nodes} = useStore()

    const columns = [
        {
            title: 'Id',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Title',
            dataIndex: ['data', 'label'],
            key: 'title',
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
            title: 'Earliest Start',
            dataIndex: ['data', 'cpm', 'earlyStart'],
            key: 'cpm.earliestStart',
            sorter: (a: Node<CpmNodeData>, b: Node<CpmNodeData>) => a.data.cpm.earlyStart - b.data.cpm.earlyStart
        },
    ]

    return <Table dataSource={nodes} columns={columns} size="small"/>
}

export const NodeTools: FC = () => {
    const {nodeToolsVisible} = useStore()
    return (
        <Drawer
            placement="bottom"
            visible={nodeToolsVisible}
            key="table-drawer"
            onClose={() => useStore.setState({nodeToolsVisible: false})}
        >
                <div><Button>Placeholder</Button></div>
                <Divider orientation="left" plain>Activities</Divider>
                <NodesTable/>
        </Drawer>
    )
}
