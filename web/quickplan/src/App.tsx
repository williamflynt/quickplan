import React, {FC} from 'react'
import {Flow} from "./components/ReactFlow/Flow";
import {Main} from "./components/Layout/Main";
import 'antd/dist/antd.css'


export const App: FC = () => {
    return (
        <Main>
            <Flow/>
        </Main>
    )
}
