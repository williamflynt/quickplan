import React, {FC, useEffect, useState} from 'react'
import {Button, Divider, Drawer, Space, Table, Typography} from "antd";
import {useStore} from "../../store/store";
import {CpmNodeType} from "../ReactFlow/CpmTaskNode";
import {LeftOutlined, PlusOutlined, RightOutlined} from "@ant-design/icons";
import {ActivityAddButton} from "./ActivityAddButton";
import {Edge} from "react-flow-renderer";

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
            sorter: (a: CpmNodeType, b: CpmNodeType) => a.data.cpm.earlyStart - b.data.cpm.earlyStart
        },
    ]

    return <Table dataSource={nodes} columns={columns} size="small"/>
}

type ActionsBarProps = {
    node: null | CpmNodeType
    edge: null | Edge
}
export const ActionsBar: FC<ActionsBarProps> = ({node, edge}) => {
    const {activeChartId} = useStore()

    if (!activeChartId) {
        return <></>
    }

    return (
        <Space>
            <ActivityAddButton graphId={activeChartId}/>
            {node &&
                <>
                    <Button ghost type="primary"><LeftOutlined/> Insert Before</Button>
                    <Button ghost type="primary"><RightOutlined/> Insert After</Button>
                    <Button danger type="text">Delete Activity</Button>
                </>
            }
            {edge &&
                <>
                    <Button type="dashed">Split {edge.id}</Button>
                    <Button danger type="dashed">Delete {edge.id}</Button>
                </>
            }
        </Space>
    )
}

export const NodeTools: FC = () => {
    const {nodeToolsVisible, activeEdgeId, activeNodeId, edges, nodes} = useStore()
    const [edge, edgeSet] = useState<null | Edge>(null)
    const [node, nodeSet] = useState<null | CpmNodeType>(null)

    useEffect(() => {
        const activeE = edges.filter((e) => e.id === activeEdgeId)
        if (activeE.length === 0) {
            edgeSet(null)
        }
        edgeSet(activeE[0])
    }, [activeEdgeId, edges])

    useEffect(() => {
        const activeN = nodes.filter((n) => n.id === activeNodeId)
        if (activeN.length === 0) {
            nodeSet(null)
        }
        nodeSet(activeN[0])
    }, [activeNodeId, nodes])

    return (
        <Drawer
            headerStyle={{display: 'none'}}
            key="table-drawer"
            mask={false}
            onClose={() => useStore.setState({nodeToolsVisible: false})}
            placement="bottom"
            visible={nodeToolsVisible}
        >
            <ActionsBar node={node} edge={edge}/>
            <Divider orientation="left" plain>Activities</Divider>
            <NodesTable/>
        </Drawer>
    )
}
