import React, {FC} from "react";
import {useStore} from "../../store/store";
import {Edge} from "react-flow-renderer";
import {CpmNodeType} from "../ReactFlow/CpmTaskNode";
import {Button, Space} from "antd";
import {ActivityAddButton} from "./ActivityAddButton";
import {LeftOutlined, RightOutlined} from "@ant-design/icons";
import {ActivityDeleteButton} from "./ActivityDeleteButton";
import {EdgeDeleteButton} from "./EdgeDeleteButton";

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
                    <Button size="small" ghost type="primary"><LeftOutlined/> Insert Before</Button>
                    <Button size="small" ghost type="primary"><RightOutlined/> Insert After</Button>
                    <ActivityDeleteButton graphId={activeChartId} node={node}/>
                </>
            }
            {edge &&
                <>
                    <Button size="small" type="dashed">Split {edge.id}</Button>
                    <EdgeDeleteButton graphId={activeChartId} edge={edge}/>
                </>
            }
        </Space>
    )
}