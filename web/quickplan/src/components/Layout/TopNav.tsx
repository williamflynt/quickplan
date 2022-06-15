import React, {FC} from "react";
import {Button, Menu} from "antd";
import {Link} from "wouter";
import {Routes} from "../../App";
import {NodeIndexOutlined} from "@ant-design/icons";
import {useStore} from "../../store/store";

export const TopNav: FC = () => {
    const {nodeToolsVisible} = useStore()

    const toggleNodeTools = () => {
        useStore.setState({nodeToolsVisible: !nodeToolsVisible})
    }
    const showNodeToolsButton = (
        <Button type="primary" onClick={toggleNodeTools}>
            Activity Tools
        </Button>
    )

    const items = [
        {key: 'home', label: <Link href={Routes.home}><NodeIndexOutlined style={{fontSize: '2em'}}/></Link>},
        {key: 'export-csv', label: <Button ghost type="primary">Export CSV</Button>},
        {key: 'export-graphiz', label: <Button ghost type="primary">Export Graphviz</Button>},
        {key: 'export-json', label: <Button ghost type="primary">Export JSON</Button>},
        {key: 'load-json', label: <Button>Load JSON</Button>},
        {key: 'see-example', label: <Link href={Routes.exampleBasic}>See Example</Link>},
        {key: 'show-node-tools', label: showNodeToolsButton},
    ]
    return (
        <Menu mode="horizontal"
              items={items}
              style={{background: '#ffffff', position: 'relative', zIndex: 1}}
        />
    )
}
