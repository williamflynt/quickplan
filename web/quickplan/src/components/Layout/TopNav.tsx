import React, {FC} from "react";
import {Button, Menu} from "antd";
import {Link} from "wouter";
import {Routes} from "../../App";
import {NodeIndexOutlined} from "@ant-design/icons";
import {useStore} from "../../store/store";
import {ExportJsonButton} from "./ExportJsonButton";
import {ExportCsvButton} from "./ExportCSVButton";
import {ExportGraphvizButton} from "./ExportGraphvizButton";
import {LoadJsonButton} from "./LoadJsonButton";
import {LoadCsvButton} from "./LoadCsvButton";

export const TopNav: FC<{ enableExport: boolean }> = ({enableExport}) => {
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
        {key: 'export-csv', label: <ExportCsvButton enabled={enableExport}/>},
        {key: 'export-graphiz', label: <ExportGraphvizButton enabled={enableExport}/>},
        {key: 'export-json', label: <ExportJsonButton enabled={enableExport}/>},
        {key: 'load-json', label: <LoadJsonButton/>},
        {key: 'load-csv', label: <LoadCsvButton/>},
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
