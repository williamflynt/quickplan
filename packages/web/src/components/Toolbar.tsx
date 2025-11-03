import React, { FC } from 'react'
import { Button, Select, Space, Tooltip } from 'antd'
import {
  FolderOpenOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { StorageIndicator, StorageStatus } from './StorageIndicator'

interface Project {
  id: number
  name: string
  updatedAt: number
}

interface ToolbarProps {
  browserStatus: StorageStatus
  diskStatus: StorageStatus
  lastBrowserSave: number | null
  lastDiskSave: number | null
  projects: Project[]
  currentProjectId: number | null
  onNew: () => void
  onOpen: () => void
  onDownload: () => void
  onReset: () => void
  onProjectSwitch: (projectId: number) => void
  onProjectRename: () => void
}

export const Toolbar: FC<ToolbarProps> = ({
  browserStatus,
  diskStatus,
  lastBrowserSave,
  lastDiskSave,
  projects,
  currentProjectId,
  onNew,
  onOpen,
  onDownload,
  onReset,
  onProjectSwitch,
  onProjectRename,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 16px',
        background: '#1e1e1e',
        borderTop: '1px solid #333',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.3)',
        minHeight: '36px',
      }}
    >
      <Space size="small">
        <Select
          value={currentProjectId}
          onChange={onProjectSwitch}
          size="small"
          style={{ minWidth: 200 }}
          placeholder="Select project..."
          suffixIcon={<FileOutlined />}
          getPopupContainer={(trigger) => trigger.parentElement || document.body}
          dropdownStyle={{
            background: '#252526',
            border: '1px solid #454545',
          }}
        >
          {projects.map((project) => (
            <Select.Option key={project.id} value={project.id}>
              <span style={{ color: '#d4d4d4' }}>
                {project.name}
                <span style={{ color: '#858585', fontSize: '0.85em', marginLeft: 8 }}>
                  {new Date(project.updatedAt).toLocaleString()}
                </span>
              </span>
            </Select.Option>
          ))}
        </Select>

        <Tooltip title="Rename current project">
          <Button
            icon={<EditOutlined />}
            onClick={onProjectRename}
            size="small"
            disabled={!currentProjectId}
            style={{
              background: '#2d2d2d',
              border: '1px solid #454545',
              color: currentProjectId ? '#d4d4d4' : '#6e6e6e',
            }}
          />
        </Tooltip>

        <Tooltip title="New Project (Ctrl/Cmd+N)">
          <Button
            icon={<PlusOutlined />}
            onClick={onNew}
            size="small"
            style={{
              background: '#2d2d2d',
              border: '1px solid #454545',
              color: '#d4d4d4',
            }}
          >
            New
          </Button>
        </Tooltip>
        
        <Tooltip title="Open Project (Ctrl/Cmd+O)">
          <Button
            icon={<FolderOpenOutlined />}
            onClick={onOpen}
            size="small"
            style={{
              background: '#2d2d2d',
              border: '1px solid #454545',
              color: '#d4d4d4',
            }}
          >
            Open
          </Button>
        </Tooltip>

        <Tooltip title="Download .pfs file (Ctrl/Cmd+S)">
          <Button
            icon={<DownloadOutlined />}
            onClick={onDownload}
            type="primary"
            size="small"
            style={{
              background: '#0e639c',
              border: '1px solid #007acc',
            }}
          >
            Download
          </Button>
        </Tooltip>

        <Tooltip title="Clear browser storage">
          <Button
            icon={<DeleteOutlined />}
            onClick={onReset}
            size="small"
            danger
            style={{
              background: '#2d2d2d',
              border: '1px solid #454545',
              color: '#ff5555',
            }}
          >
            Reset
          </Button>
        </Tooltip>
      </Space>

      <Space size="small">
        <StorageIndicator
          type="browser"
          status={browserStatus}
          lastSaveTime={lastBrowserSave || undefined}
        />
        <StorageIndicator
          type="disk"
          status={diskStatus}
          lastSaveTime={lastDiskSave || undefined}
        />
      </Space>
    </div>
  )
}
