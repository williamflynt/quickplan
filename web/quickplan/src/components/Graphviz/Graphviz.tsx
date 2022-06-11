import React, {FC, useEffect, useState} from 'react'
import axios from "axios";
import {Graphviz as Gvz} from 'graphviz-react';
import {ChartExample} from "../../api/types";

export const Graphviz: FC = () => {
    const [dot, setDot] = useState("")

    useEffect(() => {
        axios.get<ChartExample>("http://localhost:3535/api/v1/graph/example")
            .then((response) => {
                    setDot(response.data.dot)
                }
            )
    }, [])

    console.log(dot)

    return (dot ? <Gvz dot={dot}/> : <>DOT</>)
}
