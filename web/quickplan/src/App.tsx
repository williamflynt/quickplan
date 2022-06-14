import React, {FC} from 'react'
import {ReactFlowProvider} from "react-flow-renderer";
import {Flow} from "./components/ReactFlow/Flow";
import {Main} from "./components/Layout/Main";
import {Route} from "wouter";
import {FlowBasicExample} from "./components/ReactFlow/FlowBasicExample";
import 'antd/dist/antd.css'

export enum Routes {
    exampleBasic = "/example/basic",
    home = "/"
}

export const App: FC = () => {
    return (
        <ReactFlowProvider>
            <Main>

                <Flow/>

                <Route path={Routes.exampleBasic} component={FlowBasicExample}/>
            </Main>
        </ReactFlowProvider>
    )
}
