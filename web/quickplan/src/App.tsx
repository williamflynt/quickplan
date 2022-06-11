import React from 'react'
import {Flow} from "./components/Flow/Flow";
import {Graphviz} from "./components/Graphviz/Graphviz";


export const App = () => {
    return (
        <div>
            <Graphviz/>

            <hr/>

            <Flow/>
        </div>
    )
}
