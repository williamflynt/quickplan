import React, {FC} from "react";
import {useStore} from "../../store/store";
import {Edge} from "@xyflow/react";
import {CpmNodeType} from "../ReactFlow/CpmTaskNode";
import {Divider, Space} from "antd";
import {ActivityAddButton} from "./ActivityAddButton";
import {ActivityDeleteButton} from "./ActivityDeleteButton";
import {EdgeDeleteButton} from "./EdgeDeleteButton";
import {EdgeSplitButton} from "./EdgeSplitButton";
import {ActivityInsertAfter, ActivityInsertBefore} from "./ActivityInsert";
import {ActivityCloneButton} from "./ActivityCloneButton";

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
                    <ActivityCloneButton graphId={activeChartId} node={node}/>
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