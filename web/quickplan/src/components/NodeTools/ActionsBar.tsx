import React, {FC} from "react";
import {useStore} from "../../store/store";
import {Edge} from "react-flow-renderer";
import {CpmNodeType} from "../ReactFlow/CpmTaskNode";
import {Button, Space} from "antd";
import {ActivityAddButton} from "./ActivityAddButton";
import {LeftOutlined, RightOutlined} from "@ant-design/icons";

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