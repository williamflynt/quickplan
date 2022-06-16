import React, {FC} from 'react';
import {Layout} from "antd";
import {Content, Header} from "antd/es/layout/layout";
import {TopNav} from "./TopNav";
import {useLocation} from "wouter";

interface MainProps {
    children?: React.ReactNode
}

export const Main: FC<MainProps> = ({children}) => {
    const [location,] = useLocation();
    const enableExport = !location.includes("example")

    // <Content> style matches <Header /> CSS from Antd styles.
    return (
        <Layout style={{background: 'none'}}>

            <Header>
                <TopNav enableExport={enableExport}/>
            </Header>

            <Content style={{padding: '0 50px', background: '#001529'}}>
                <div id="main-interior" style={{height: '95vh', background: '#ffffff'}}>
                    {children}
                </div>
            </Content>

        </Layout>
    )
}
