import React, {FC, useEffect, useState} from 'react'
import {Button, Divider, Drawer, Space} from "antd";
import {useStore} from "../../store/store";
import {CpmNodeType} from "../ReactFlow/CpmTaskNode";
import {LeftOutlined, RightOutlined} from "@ant-design/icons";
import {ActivityAddButton} from "./ActivityAddButton";
import {Edge} from "react-flow-renderer";
import {NodesTable} from "./NodesTable";

export const ActionsBar: FC = () => {
    const {activeChartId, activeEdgeId, activeNodeId, edges, nodes} = useStore()
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
    const {nodeToolsVisible} = useStore()

    return (
        <Drawer
            headerStyle={{display: 'none'}}
            key="table-drawer"
            mask={false}
            onClose={() => useStore.setState({nodeToolsVisible: false})}
            placement="bottom"
            visible={nodeToolsVisible}
        >
            <ActionsBar />
            <Divider orientation="left" plain>Activities</Divider>
            <NodesTable/>
        </Drawer>
    )
}
