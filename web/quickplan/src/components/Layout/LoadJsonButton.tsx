import React, {FC} from 'react'
import {Button, message, Upload} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import api from "../../api/api";
import {SetupChart} from "../ReactFlow/SetupChart";
import {useStore} from "../../store/store";

export const LoadJsonButton: FC = () => {
    const doLoad = (fileData: string) => {
        api.graphLoad(fileData).then((response) => {
            SetupChart(response.data)
            useStore.setState({activeChartId: response.data.id})
            message.success('Loaded Chart');
        })
            .catch(() => {
                message.error('Could not load Chart');
            })
    };

    return (
        <Upload
            accept=".json"
            maxCount={1}
            showUploadList={false}
            beforeUpload={file => {
                const reader = new FileReader();

                reader.onload = e => {
                    const data = e.target?.result || null
                    if (!data) {
                        return
                    }
                    doLoad(data as string)
                };
                reader.readAsText(file);

                // Prevent upload.
                return false;
            }}
        >
            <Button><UploadOutlined/> Load JSON</Button>
        </Upload>
    )

}