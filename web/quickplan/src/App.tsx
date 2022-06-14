import React, {FC} from 'react'
import {ReactFlowProvider} from "react-flow-renderer";
import {Flow} from "./components/ReactFlow/Flow";
import {Main} from "./components/Layout/Main";
import {Route} from "wouter";
import {FlowBasicExample} from "./components/ReactFlow/FlowBasicExample";
import 'antd/dist/antd.css'


export const App: FC = () => {
    return (
        <ReactFlowProvider>
            <Main>

                <Flow/>

                <Route path="/example/basic" component={FlowBasicExample}/>
            </Main>
        </ReactFlowProvider>
    )
}
