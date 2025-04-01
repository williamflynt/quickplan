import React, { FC } from 'react'
import { Button, message } from 'antd'
import { useStore } from '../../store/store'
import api from '../../api/api'
import FileSaver from 'file-saver'

export const ExportCsvButton: FC<{ enabled: boolean }> = ({ enabled }) => {
  const { activeChartId } = useStore()

  const onClick = () => {
    if (!activeChartId || !enabled) {
      return
    }
    api
      .graphExportsCsv(activeChartId)
      .then((response) => {
        const blob = new Blob([response.data], { type: 'text/csv' })
        const fileName = `quickplan.${activeChartId}.csv`
        FileSaver.saveAs(blob, fileName)
      })
      .catch(() => {
        message.error('Could not export Chart')
      })
  }

  return (
    <Button disabled={!enabled} ghost type="primary" onClick={onClick}>
      Save CSV
    </Button>
  )
}
