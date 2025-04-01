import React, { FC } from 'react'
import { useStore } from '../../store/store'
import { Button, message } from 'antd'
import api from '../../api/api'
import { SetupChart } from './SetupChart'

export const ReflowButton: FC = () => {
  const { activeChartId, positionHoldCanReflow } = useStore()

  const isReady = positionHoldCanReflow && activeChartId !== null

  const onClick = () => {
    if (!activeChartId) {
      return
    }

    api
      .graphGet(activeChartId)
      .then((response) => {
        SetupChart(response.data, true)
      })
      .catch(() => {
        message.error('Could not get Chart info from server')
      })
      .finally(() => {
        useStore.setState({ positionHoldCanReflow: false })
      })
  }

  return (
    <Button
      ghost={!isReady}
      type="primary"
      size="small"
      onClick={onClick}
      style={{ position: 'absolute', right: 10, top: 10, zIndex: 5 }}
    >
      Reset Layout
    </Button>
  )
}
