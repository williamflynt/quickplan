import React, {FC, useEffect, useState} from 'react'
import {Col, Divider, Drawer, Row} from "antd";
import {useStore} from "../../store/store";
import {NodesTable} from "./NodesTable";
import {NodeForm} from "./NodeForm";
import {ActionsBar} from "./ActionsBar";
import {Edge} from "@xyflow/react";
import {CpmNodeType} from "../ReactFlow/CpmTaskNode";

export const NodeTools: FC = () => {
    const {activeChartId, nodeToolsVisible, activeEdgeId, edges, activeNodeId, nodes} = useStore()

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
        <Drawer
            headerStyle={{display: 'none'}}
            key="table-drawer"
            mask={false}
            onClose={() => useStore.setState({nodeToolsVisible: false})}
            placement="bottom"
            visible={nodeToolsVisible}
            height={430}
        >
            <ActionsBar node={node} edge={edge}/>
            <Divider orientation="left" plain/>
            <Row justify="start" gutter={[32, 16]}>
                <Col flex="none"><NodeForm node={node}/></Col>
                <Col flex="auto"><NodesTable/></Col>
            </Row>
        </Drawer>
    )
}
