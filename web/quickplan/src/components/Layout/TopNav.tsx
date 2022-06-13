import React, {FC} from "react";
import {Menu} from "antd";

export const TopNav: FC = () => {
    const items = [
        {key: 'export-graphiz', label: 'Export Graphviz'}
    ]
    return (
        <Menu mode="horizontal"
              items={items}
              style={{background: '#ffffff', position: 'relative', zIndex: 1}}
        />
    )

}