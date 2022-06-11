import React from 'react'
import {Flow} from "./components/Flow/Flow";
import axios from "axios";

type Node = {
    id: string,
    duration: number,
    label: string,
    earliestStart: number,
    earliestFinish: number,
    latestStart: number,
    latestFinish: number,
    slack: number,
}

type Arrow = {
    id: string
    from: string
    to: string
    criticalPath: boolean
}

type Chart = {
    nodes: Node[]
    arrows: Arrow[]
    Title: string
}

export const App = async () => {
    const data: Chart = await axios.get("https://localhost:3535/api/v1/graph/example")

    let x = 0
    let y = 0
    const nodes = data.nodes.map((n) => {
        x += 25
        y += 25
        return {id: n.id, data: {label: n.label}, position: {x: x, y: y}}
    })
    const edges = data.arrows.map((a) => {
        return {id: a.id, source: a.from, target: a.to}
    })
    return (
        <Flow nodes={nodes} edges={edges}/>
    )
}
