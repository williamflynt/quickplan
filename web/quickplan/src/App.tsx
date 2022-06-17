import React, {FC} from 'react'
import {ReactFlowProvider} from "react-flow-renderer";
import {Main} from "./components/Layout/Main";
import {Route} from "wouter";
import {FlowBase} from "./components/ReactFlow/FlowBase";
import {NodeTools} from "./components/NodeTools/NodeTools";
import 'antd/dist/antd.css'
import './assets/App.css'
import {FlowSpecificChart} from "./components/ReactFlow/FlowSpecificChart";

export enum Routes {
    home = "/",
    specificChart = "/:chartId"
}

export const App: FC = () => {
    return (
        <ReactFlowProvider>
            <Main>
                <NodeTools/>
                <Route path={Routes.home} component={FlowBase}/>
                <Route path={Routes.specificChart}>
                    {(params) => <FlowSpecificChart id={params.chartId}/>}
                </Route>
            </Main>
        </ReactFlowProvider>
    )
}
