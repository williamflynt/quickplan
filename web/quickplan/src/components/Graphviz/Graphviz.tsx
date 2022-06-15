import React, {FC, useEffect, useState} from 'react'
import axios from "axios";
import {Graphviz as Gvz} from 'graphviz-react';
import {Chart} from "../../api/types";

export const Graphviz: FC = () => {
    const [dot, setDot] = useState("")

    useEffect(() => {
        axios.get<Chart>("http://localhost:3535/api/v1/graph/example")
            .then((response) => {
                    // TODO: Retrieve example DOT export. (wf 14 June 22)
                }
            )
    }, [])

    console.log(dot)

    return (dot ? <Gvz dot={dot}/> : <>DOT</>)
}
