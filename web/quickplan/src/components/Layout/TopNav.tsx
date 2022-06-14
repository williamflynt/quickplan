import React, {FC} from "react";
import {Button, Menu} from "antd";
import {Link} from "wouter";
import {Routes} from "../../App";
import {NodeIndexOutlined} from "@ant-design/icons";

export const TopNav: FC = () => {
    const items = [
        {key: 'home', label: <Link href={Routes.home}><NodeIndexOutlined style={{fontSize: '2em'}}/></Link>},
        {key: 'export-graphiz', label: <Button ghost type="primary">Export Graphviz</Button>},
        {key: 'load-graphviz', label: <Button>Load Graphviz</Button>},
        {key: 'export-json', label: <Button ghost type="primary">Export JSON</Button>},
        {key: 'load-json', label: <Button>Load JSON</Button>},
        {key: 'see-example', label: <Link href={Routes.exampleBasic}>See Example</Link>},
    ]
    return (
        <Menu mode="horizontal"
              items={items}
              style={{background: '#ffffff', position: 'relative', zIndex: 1}}
        />
    )

}
