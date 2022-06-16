import React, {FC} from 'react'
import {Button, message} from "antd";
import {useStore} from "../../store/store";
import api from "../../api/api";
import FileSaver from "file-saver";

export const ExportJsonButton: FC<{enabled: boolean}> = ({enabled}) => {
    const {activeChartId} = useStore()

    const onClick = () => {
        if (!activeChartId || !enabled) {
            return
        }
        api.graphExportsJson(activeChartId).then((response) => {
            const blob = new Blob([response.data], {type: "application/json"})
            const fileName = `quickplan.${activeChartId}.json`
            FileSaver.saveAs(blob, fileName)
        }).catch(() => {
            message.error("Could not export Chart")
        })
    }

    return (
        <Button disabled={!enabled} ghost type="primary" onClick={onClick}>Save JSON</Button>
    )
}