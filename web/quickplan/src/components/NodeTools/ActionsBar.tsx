import React, {FC} from "react";
import {useStore} from "../../store/store";
import {Edge} from "react-flow-renderer";
import {CpmNodeType} from "../ReactFlow/CpmTaskNode";
import {Button, Divider, Space} from "antd";
import {ActivityAddButton} from "./ActivityAddButton";
import {LeftOutlined, RightOutlined} from "@ant-design/icons";
import {ActivityDeleteButton} from "./ActivityDeleteButton";
import {EdgeDeleteButton} from "./EdgeDeleteButton";
import {EdgeSplitButton} from "./EdgeSplitButton";
import {ActivityInsertBefore, ActivityInsertAfter} from "./ActivityInsert";

type ActionsBarProps = {
    node: CpmNodeType | null
    edge: Edge | null
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
                    <ActivityInsertBefore graphId={activeChartId} node={node}/>
                    <ActivityInsertAfter graphId={activeChartId} node={node}/>
                    <ActivityDeleteButton graphId={activeChartId} node={node}/>
                </>
            }
            {edge &&
                <>
                    <Divider type={"vertical"}/>
                    <EdgeSplitButton graphId={activeChartId} edge={edge}/>
                    <EdgeDeleteButton graphId={activeChartId} edge={edge}/>
                </>
            }
        </Space>
    )
}