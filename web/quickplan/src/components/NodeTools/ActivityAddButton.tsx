import React, {FC} from "react";
import {Button} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import api from "../../api/api";
import {SetupChart} from "../ReactFlow/SetupChart";

export const ActivityAddButton: FC<{ graphId: string }> = ({graphId}) => {
    const onClick = () => {
        // Create a totally blank Activity with auto-generated ID.
        // We can fill in the rest later.
        api.graphActivityNew(graphId, JSON.stringify({})).then((response) => {
            SetupChart(response.data)
        })
    }
    return <Button type="primary" size="small" onClick={onClick}><PlusOutlined/>Add Activity</Button>
}
