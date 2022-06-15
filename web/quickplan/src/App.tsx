import React, {FC} from 'react'
import {ReactFlowProvider} from "react-flow-renderer";
import {Flow} from "./components/ReactFlow/Flow";
import {Main} from "./components/Layout/Main";
import {Route} from "wouter";
import {FlowBasicExample} from "./components/ReactFlow/FlowBasicExample";
import 'antd/dist/antd.css'
import {NodeTools} from "./components/ReactFlow/NodeTools";

export enum Routes {
    exampleBasic = "/example/basic",
    home = "/"
}

export const App: FC = () => {
    return (
        <ReactFlowProvider>
            <Main>
                <NodeTools />

                <Flow/>
                <Route path={Routes.exampleBasic} component={FlowBasicExample}/>
            </Main>
        </ReactFlowProvider>
    )
}
