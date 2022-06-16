import React, {FC} from "react";
import {Button} from "antd";
import api from "../../api/api";
import {SetupChart} from "../ReactFlow/SetupChart";
import {useStore} from "../../store/store";
import {Edge} from "react-flow-renderer";
import {GraphDependency} from "../../api/types";
import {ArrowLeftOutlined, ArrowRightOutlined, PlusSquareOutlined} from "@ant-design/icons";

export const EdgeSplitButton: FC<{ graphId: string, edge: Edge }> = ({graphId, edge}) => {
    const onClick = () => {
        if (!edge) {
            return
        }
        const dep: GraphDependency = {firstId: edge.source, nextId: edge.target}
        api.graphDependencySplit(graphId, JSON.stringify(dep)).then((response) => {
            SetupChart(response.data, true) // We need to reflow because there is a new node.
            useStore.setState({activeEdgeId: null})
        })
    }
    return (
        <Button type="dashed" size="small" onClick={onClick}>
            <ArrowLeftOutlined/><PlusSquareOutlined/><ArrowRightOutlined/> Split Dependency
        </Button>
    )
}
