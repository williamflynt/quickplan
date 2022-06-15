import React, {FC} from "react";
import {Button} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import api from "../../api/api";
import {SetupChart} from "../ReactFlow/SetupChart";
import {useReactFlow} from "react-flow-renderer";

export const ActivityAddButton: FC<{ graphId: string }> = ({graphId}) => {
    const {setNodes, setEdges} = useReactFlow()

    const onClick = () => {
        // Create a totally blank Activity with auto-generated ID.
        // We can fill in the rest later.
        api.graphActivityNew(graphId, JSON.stringify({})).then((response) => {
            SetupChart(response.data, setNodes, setEdges)
        })
    }
    return <Button type="primary" onClick={onClick}><PlusOutlined/>New Activity</Button>
}
