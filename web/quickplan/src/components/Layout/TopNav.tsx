import React, {FC} from "react";
import {Button, Menu} from "antd";

export const TopNav: FC = () => {
    const items = [
        {key: 'export-graphiz', label: <Button ghost type="primary">Export Graphviz</Button>},
        {key: 'load-graphviz', label: <Button>Load Graphviz</Button>},
        {key: 'export-json', label: <Button ghost type="primary">Export JSON</Button>},
        {key: 'load-json', label: <Button>Load JSON</Button>},
    ]
    return (
        <Menu mode="horizontal"
              items={items}
              style={{background: '#ffffff', position: 'relative', zIndex: 1}}
        />
    )

}
