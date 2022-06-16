import React, {FC} from "react";
import {Button, Popconfirm} from "antd";
import api from "../../api/api";
import {SetupChart} from "../ReactFlow/SetupChart";
import {useStore} from "../../store/store";
import {CpmNodeType} from "../ReactFlow/CpmTaskNode";
import {QuestionCircleOutlined} from "@ant-design/icons";

export const ActivityDeleteButton: FC<{ graphId: string, node: CpmNodeType }> = ({graphId, node}) => {
    const onClick = () => {
        if (!node) {
            return
        }
        api.graphActivityDelete(graphId, node.id).then((response) => {
            SetupChart(response.data)
            useStore.setState({activeNodeId: null})
        })
    }
    return (
        <Popconfirm title={`Really delete ${node.id}?`}
                    onConfirm={onClick}
                    icon={<QuestionCircleOutlined style={{color: 'red'}}/>}
                    okText="Delete"
                    >
            <Button danger type="text" size="small">
                Delete Activity
            </Button>
        </Popconfirm>
    )
}
