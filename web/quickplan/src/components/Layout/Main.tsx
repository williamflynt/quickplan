import React, {FC} from 'react';
import {Layout} from "antd";
import {Content, Header} from "antd/es/layout/layout";
import {TopNav} from "./TopNav";

interface MainProps {
    children?: React.ReactNode
}

export const Main: FC<MainProps> = ({children}) => {
    // Content style matches Header css.
    return (
        <Layout style={{background: 'none'}}>

            <Header>
                <TopNav/>
            </Header>

            <Content style={{padding: '0 50px', background: '#001529'}}>
                <div id="main-interior" style={{height: '95vh', background: '#ffffff'}}>
                    {children}
                </div>
            </Content>

        </Layout>
    )
}
