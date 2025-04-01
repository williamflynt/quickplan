import React, { FC } from 'react'
import { Button, message, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import api from '../../api/api'
import { SetupChart } from '../ReactFlow/SetupChart'
import { useStore } from '../../store/store'

export const LoadCsvButton: FC = () => {
  const doLoad = (fileData: string) => {
    api
      .graphNewFromCsv(fileData)
      .then((response) => {
        SetupChart(response.data)
        useStore.setState({ activeChartId: response.data.id })
        message.success('Loaded Chart')
      })
      .catch(() => {
        message.error('Could not load Chart')
      })
  }

  return (
    <Upload
      accept=".csv"
      maxCount={1}
      showUploadList={false}
      beforeUpload={(file) => {
        const reader = new FileReader()

        reader.onload = (e) => {
          const data = e.target?.result || null
          if (!data) {
            return
          }
          doLoad(data as string)
        }
        reader.readAsText(file)

        // Prevent upload.
        return false
      }}
    >
      <Button>
        <UploadOutlined /> Load CSV
      </Button>
    </Upload>
  )
}
