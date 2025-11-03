import React, { FC } from 'react'
import { Modal } from 'antd'

interface CheatSheetModalProps {
  visible: boolean
  onClose: () => void
}

export const CheatSheetModal: FC<CheatSheetModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      title="Project Flow Syntax (PFS) Quick Reference"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      bodyStyle={{
        maxHeight: '70vh',
        overflowY: 'auto',
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ padding: '8px' }}>
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#4ec9b0', marginBottom: '12px' }}>Sigils & Prefixes</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: '#569cd6' }}>Task</td>
                <td style={{ padding: '8px', color: '#ce9178' }}>none</td>
                <td style={{ padding: '8px' }}>TaskName</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: '#569cd6' }}>Resource</td>
                <td style={{ padding: '8px', color: '#ce9178' }}>$</td>
                <td style={{ padding: '8px' }}>$Alice, $BuildServer</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: '#569cd6' }}>Milestone</td>
                <td style={{ padding: '8px', color: '#ce9178' }}>%</td>
                <td style={{ padding: '8px' }}>%ProjectComplete</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: '#569cd6' }}>Cluster</td>
                <td style={{ padding: '8px', color: '#ce9178' }}>@</td>
                <td style={{ padding: '8px' }}>@Phase1</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: '#569cd6' }}>Comment</td>
                <td style={{ padding: '8px', color: '#ce9178' }}>#</td>
                <td style={{ padding: '8px' }}># This is a comment</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#4ec9b0', marginBottom: '12px' }}>Operators</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: '#569cd6' }}>Dependency</td>
                <td style={{ padding: '8px', color: '#ce9178' }}>&gt;</td>
                <td style={{ padding: '8px' }}>TaskA &gt; TaskB</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: '#569cd6' }}>Remove</td>
                <td style={{ padding: '8px', color: '#ce9178' }}>~</td>
                <td style={{ padding: '8px' }}>~TaskName, A ~&gt; B</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: '#569cd6' }}>Explode</td>
                <td style={{ padding: '8px', color: '#ce9178' }}>!</td>
                <td style={{ padding: '8px' }}>Task ! 5, Task ! A, B</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: '#569cd6' }}>Implode</td>
                <td style={{ padding: '8px', color: '#ce9178' }}>/</td>
                <td style={{ padding: '8px' }}>A, B, C / Combined</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '8px', color: '#569cd6' }}>Split</td>
                <td style={{ padding: '8px', color: '#ce9178' }}>*</td>
                <td style={{ padding: '8px' }}>* &gt; Task, Task &gt; *</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#4ec9b0', marginBottom: '12px' }}>Task Syntax</h3>
          <pre style={{ 
            background: '#252526', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '12px',
            lineHeight: '1.6',
            border: '1px solid #333',
          }}>
{`# Simple task
TaskName

# With attributes
TaskName(duration: 5, owner: "Alice")

# Quick duration notation
TaskName 2 5 8              # low, likely, high
TaskName 2 8                # low, high
TaskName 5                  # likely only
TaskName 2 5 8 "Description"`}
          </pre>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#4ec9b0', marginBottom: '12px' }}>Dependencies</h3>
          <pre style={{ 
            background: '#252526', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '12px',
            lineHeight: '1.6',
            border: '1px solid #333',
          }}>
{`# Sequential
A > B > C > D

# Multiple predecessors
A, B > C

# Multiple successors
A > B, C

# Complex
A, B > C, D                 # Creates all combinations`}
          </pre>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#4ec9b0', marginBottom: '12px' }}>Resource Assignment</h3>
          <pre style={{ 
            background: '#252526', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '12px',
            lineHeight: '1.6',
            border: '1px solid #333',
          }}>
{`# Define resource
$Alice(role: "Developer")

# Assign to tasks (either direction)
$Alice > TaskA, TaskB
TaskA, TaskB > $Alice

# Remove assignment
$Alice ~> TaskA`}
          </pre>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#4ec9b0', marginBottom: '12px' }}>Complete Example</h3>
          <pre style={{ 
            background: '#252526', 
            padding: '12px', 
            borderRadius: '4px',
            fontSize: '11px',
            lineHeight: '1.6',
            border: '1px solid #333',
          }}>
{`# Software Development Project
$Alice(role: "Developer")
$Bob(role: "QA")

# Planning phase
Requirements 2 3 5 "Gather requirements"
Design 3 5 8 "System architecture"

# Development
Implementation 5 8 12
Testing 2 3 4

# Deployment
Deploy 1 "Deploy to production"

# Dependencies
Requirements > Design > Implementation > Testing > Deploy

# Resource assignments
$Alice > Requirements, Design, Implementation
$Bob > Testing

# Clusters
@Planning: Requirements, Design
@Dev: Implementation, Testing

# Milestones
%LaunchDay(date: "2024-12-01")
Deploy > %LaunchDay`}
          </pre>
        </section>

        <section>
          <h3 style={{ color: '#4ec9b0', marginBottom: '12px' }}>Tips</h3>
          <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>Names can contain letters, numbers, underscores, dots, and hyphens</li>
            <li>Use PascalCase for tasks: DesignAPI, ImplementAuth</li>
            <li>Durations use three-point estimation (PERT)</li>
            <li>Comments start with # and run to end of line</li>
            <li>Multi-line comments use """ ... """</li>
          </ul>
        </section>
      </div>
    </Modal>
  )
}
