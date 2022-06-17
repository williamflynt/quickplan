import React, {FC} from 'react'
import {ReactFlowProvider} from "react-flow-renderer";
import {Main} from "./components/Layout/Main";
import {Route} from "wouter";
import {FlowBase} from "./components/ReactFlow/FlowBase";
import {NodeTools} from "./components/NodeTools/NodeTools";
import 'antd/dist/antd.css'
import './assets/App.css'

export enum Routes {
    home = "/"
}

export const App: FC = () => {
    return (
        <ReactFlowProvider>
            <Main>
                <NodeTools />
                <Route path={Routes.home} component={FlowBase}/>
            </Main>
        </ReactFlowProvider>
    )
}
