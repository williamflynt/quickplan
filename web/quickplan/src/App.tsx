import React, {FC} from 'react'
import {ReactFlowProvider} from "react-flow-renderer";
import {Main} from "./components/Layout/Main";
import {Route} from "wouter";
import {FlowBase} from "./components/ReactFlow/FlowBase";
import {FlowBasicExample} from "./components/ReactFlow/FlowBasicExample";
import {NodeTools} from "./components/ReactFlow/NodeTools";
import 'antd/dist/antd.css'
import './assets/App.css'

export enum Routes {
    exampleBasic = "/example/basic",
    home = "/"
}

export const App: FC = () => {
    return (
        <ReactFlowProvider>
            <Main>
                <NodeTools />
                <Route path={Routes.home} component={FlowBase}/>
                <Route path={Routes.exampleBasic} component={FlowBasicExample}/>
            </Main>
        </ReactFlowProvider>
    )
}
