import React, { FC } from 'react'
import { Modal, Typography, Divider, Tag } from 'antd'

const { Title, Text, Paragraph } = Typography

interface CheatSheetProps {
  visible: boolean
  onClose: () => void
}

export const CheatSheet: FC<CheatSheetProps> = ({ visible, onClose }) => {
  return (
    <Modal
      title={
        <span style={{ color: '#d4d4d4' }}>
          Project Flow Syntax Quick Reference
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      styles={{
        content: {
          background: '#252526',
          boxShadow: 'none',
          padding: '20px 24px',
        },
        header: {
          background: '#252526',
          borderBottom: '1px solid #454545',
          padding: '16px 20px',
        },
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: '20px',
        },
      }}
      style={{
        top: 40,
      }}
      modalRender={(modal) => (
        <div
          style={{
            background: '#252526',
            borderRadius: '4px',
            border: '1px solid #2d2d2d',
          }}
        >
          {modal}
        </div>
      )}
    >
      <div style={{ color: '#d4d4d4' }}>
        <section style={{ marginBottom: 24 }}>
          <Title
            level={4}
            style={{ color: '#d4d4d4', marginTop: 0, fontSize: '16px' }}
          >
            Entities
          </Title>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #454545' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 4px',
                    color: '#858585',
                    fontWeight: 500,
                  }}
                >
                  Entity
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 4px',
                    color: '#858585',
                    fontWeight: 500,
                  }}
                >
                  Sigil
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 4px',
                    color: '#858585',
                    fontWeight: 500,
                  }}
                >
                  Example
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>Task</td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    none
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    create_design
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Resource
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    $
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    $Alice
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Milestone
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#d7ba7d',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    %
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#d7ba7d',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    %Done
                  </code>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Cluster
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#dcdcaa',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    @
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#dcdcaa',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    @Phase1
                  </code>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <Divider style={{ borderColor: '#454545', margin: '16px 0' }} />

        <section style={{ marginBottom: 24 }}>
          <Title level={4} style={{ color: '#d4d4d4', fontSize: '16px' }}>
            Task Durations
          </Title>
          <div style={{ marginBottom: 8 }}>
            <code
              style={{
                color: '#9cdcfe',
                background: '#0f0f0f',
                padding: '4px 8px',
                borderRadius: '3px',
              }}
            >
              TaskName 2 5 8
            </code>
            <Text
              style={{ color: '#858585', marginLeft: 12, fontSize: '13px' }}
            >
              Three-point estimate (low, likely, high)
            </Text>
          </div>
          <div style={{ marginBottom: 8 }}>
            <code
              style={{
                color: '#9cdcfe',
                background: '#0f0f0f',
                padding: '4px 8px',
                borderRadius: '3px',
              }}
            >
              TaskName 2 8
            </code>
            <Text
              style={{ color: '#858585', marginLeft: 12, fontSize: '13px' }}
            >
              Two-point estimate (low, high)
            </Text>
          </div>
          <div style={{ marginBottom: 8 }}>
            <code
              style={{
                color: '#9cdcfe',
                background: '#0f0f0f',
                padding: '4px 8px',
                borderRadius: '3px',
              }}
            >
              TaskName 5
            </code>
            <Text
              style={{ color: '#858585', marginLeft: 12, fontSize: '13px' }}
            >
              Single estimate (likely)
            </Text>
          </div>
          <div>
            <code
              style={{
                color: '#9cdcfe',
                background: '#0f0f0f',
                padding: '4px 8px',
                borderRadius: '3px',
              }}
            >
              TaskName 2 5 8 "Description"
            </code>
            <Text
              style={{ color: '#858585', marginLeft: 12, fontSize: '13px' }}
            >
              With description
            </Text>
          </div>
        </section>

        <Divider style={{ borderColor: '#454545', margin: '16px 0' }} />

        <section style={{ marginBottom: 24 }}>
          <Title level={4} style={{ color: '#d4d4d4', fontSize: '16px' }}>
            Operations
          </Title>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #454545' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 4px',
                    color: '#858585',
                    fontWeight: 500,
                  }}
                >
                  Operation
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 4px',
                    color: '#858585',
                    fontWeight: 500,
                  }}
                >
                  Syntax
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 4px',
                    color: '#858585',
                    fontWeight: 500,
                  }}
                >
                  Example
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Dependency
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    A &gt; B
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    Design &gt; Build
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>Chain</td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    A &gt; B &gt; C
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    Plan &gt; Build &gt; Test
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Multiple
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    A, B &gt; C
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    API, UI &gt; Test
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Assignment
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    $R &gt; T
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    $Alice &gt; Design
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>Remove</td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    A ~&gt; B
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    Design ~&gt; Test
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Explode
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    T ! 5
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    Test ! 3
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Explode Named
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    T ! A, B
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    Dev ! API, UI
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Implode
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    A, B / C
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    T1, T2 / Task
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Split Left
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    * &gt; T
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    * &gt; Start
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Split Right
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    T &gt; *
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    End &gt; *
                  </code>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Delete Entity
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    ~Entity
                  </code>
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    ~Task, ~$Alice
                  </code>
                </td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              marginTop: 8,
              fontSize: '13px',
              color: '#858585',
              fontStyle: 'italic',
            }}
          >
            Note:{' '}
            <code
              style={{
                color: '#c586c0',
                background: '#0f0f0f',
                padding: '2px 4px',
                borderRadius: '2px',
              }}
            >
              ~
            </code>{' '}
            is negation/removal. Split creates a new task node (mitosis).
            Implode combines multiple tasks into one.
          </div>
        </section>

        <Divider style={{ borderColor: '#454545', margin: '16px 0' }} />

        <section style={{ marginBottom: 24 }}>
          <Title level={4} style={{ color: '#d4d4d4', fontSize: '16px' }}>
            Attributes
          </Title>
          <div style={{ marginBottom: 8 }}>
            <code
              style={{
                color: '#9cdcfe',
                background: '#0f0f0f',
                padding: '4px 8px',
                borderRadius: '3px',
              }}
            >
              TaskName(duration: 5, priority: high)
            </code>
          </div>
          <div style={{ marginBottom: 8 }}>
            <code
              style={{
                color: '#4ec9b0',
                background: '#0f0f0f',
                padding: '4px 8px',
                borderRadius: '3px',
              }}
            >
              $Alice(role: "Developer", rate: 100)
            </code>
          </div>
          <div>
            <code
              style={{
                color: '#d7ba7d',
                background: '#0f0f0f',
                padding: '4px 8px',
                borderRadius: '3px',
              }}
            >
              %Launch(date: "2024-12-01")
            </code>
          </div>
        </section>

        <Divider style={{ borderColor: '#454545', margin: '16px 0' }} />

        <section style={{ marginBottom: 24 }}>
          <Title level={4} style={{ color: '#d4d4d4', fontSize: '16px' }}>
            Calendar Scheduling
          </Title>
          <Paragraph
            style={{ color: '#858585', fontSize: '13px', marginBottom: 12 }}
          >
            Use the{' '}
            <code
              style={{
                color: '#c586c0',
                background: '#0f0f0f',
                padding: '2px 4px',
                borderRadius: '2px',
              }}
            >
              project
            </code>{' '}
            keyword to enable calendar-aware scheduling. The Gantt chart will
            show real dates with weekend/holiday gaps.
          </Paragraph>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #454545' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 4px',
                    color: '#858585',
                    fontWeight: 500,
                  }}
                >
                  Feature
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 4px',
                    color: '#858585',
                    fontWeight: 500,
                  }}
                >
                  Syntax
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Project start date
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    project(startDate: "2026-03-02")
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Default workdays
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    project(startDate: "2026-03-02", workdays: "m,t,w,th,f")
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Holidays
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    project(startDate: "2026-03-02", holidays: "2026-12-25")
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Resource workdays
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    $Bob(workdays: "t,w,th,f,s")
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>PTO</td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    $Alice(pto: "2026-03-10,2026-03-11")
                  </code>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #2d2d2d' }}>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  PTO range
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#4ec9b0',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    $Alice(pto: "2026-04-01..2026-04-05")
                  </code>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 4px', color: '#d4d4d4' }}>
                  Date constraint
                </td>
                <td style={{ padding: '8px 4px' }}>
                  <code
                    style={{
                      color: '#9cdcfe',
                      background: '#0f0f0f',
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}
                  >
                    Deploy(after: "2026-04-01")
                  </code>
                </td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              marginTop: 8,
              fontSize: '13px',
              color: '#858585',
              fontStyle: 'italic',
            }}
          >
            Workday abbreviations:{' '}
            <code
              style={{
                color: '#c586c0',
                background: '#0f0f0f',
                padding: '2px 4px',
                borderRadius: '2px',
              }}
            >
              m
            </code>{' '}
            <code
              style={{
                color: '#c586c0',
                background: '#0f0f0f',
                padding: '2px 4px',
                borderRadius: '2px',
              }}
            >
              t
            </code>{' '}
            <code
              style={{
                color: '#c586c0',
                background: '#0f0f0f',
                padding: '2px 4px',
                borderRadius: '2px',
              }}
            >
              w
            </code>{' '}
            <code
              style={{
                color: '#c586c0',
                background: '#0f0f0f',
                padding: '2px 4px',
                borderRadius: '2px',
              }}
            >
              th
            </code>{' '}
            <code
              style={{
                color: '#c586c0',
                background: '#0f0f0f',
                padding: '2px 4px',
                borderRadius: '2px',
              }}
            >
              f
            </code>{' '}
            <code
              style={{
                color: '#c586c0',
                background: '#0f0f0f',
                padding: '2px 4px',
                borderRadius: '2px',
              }}
            >
              s
            </code>{' '}
            <code
              style={{
                color: '#c586c0',
                background: '#0f0f0f',
                padding: '2px 4px',
                borderRadius: '2px',
              }}
            >
              su
            </code>
            . Default is Mon-Fri. Without the{' '}
            <code
              style={{
                color: '#c586c0',
                background: '#0f0f0f',
                padding: '2px 4px',
                borderRadius: '2px',
              }}
            >
              project
            </code>{' '}
            keyword, the schedule uses abstract offsets.
          </div>
        </section>

        <Divider style={{ borderColor: '#454545', margin: '16px 0' }} />

        <section>
          <Title level={4} style={{ color: '#d4d4d4', fontSize: '16px' }}>
            Quick Example
          </Title>
          <pre
            style={{
              background: '#0f0f0f',
              padding: 12,
              borderRadius: 4,
              border: '1px solid #454545',
              overflow: 'auto',
              margin: 0,
            }}
          >
            <code
              style={{ color: '#d4d4d4', fontSize: '13px', lineHeight: '1.6' }}
            >
              <div style={{ color: '#6a9955' }}># Calendar configuration</div>
              <div>
                <span style={{ color: '#c586c0' }}>project</span>
                <span style={{ color: '#d4d4d4' }}>(</span>
                <span style={{ color: '#9cdcfe' }}>startDate</span>
                <span style={{ color: '#d4d4d4' }}>: </span>
                <span style={{ color: '#ce9178' }}>"2026-03-02"</span>
                <span style={{ color: '#d4d4d4' }}>, </span>
                <span style={{ color: '#9cdcfe' }}>workdays</span>
                <span style={{ color: '#d4d4d4' }}>: </span>
                <span style={{ color: '#ce9178' }}>"m,t,w,th,f"</span>
                <span style={{ color: '#d4d4d4' }}>, </span>
                <span style={{ color: '#9cdcfe' }}>holidays</span>
                <span style={{ color: '#d4d4d4' }}>: </span>
                <span style={{ color: '#ce9178' }}>"2026-03-17"</span>
                <span style={{ color: '#d4d4d4' }}>)</span>
              </div>
              <br />
              <div style={{ color: '#6a9955' }}>
                # Team with roles, workdays, and PTO
              </div>
              <div>
                <span style={{ color: '#4ec9b0' }}>$Alice</span>
                <span style={{ color: '#d4d4d4' }}>(</span>
                <span style={{ color: '#9cdcfe' }}>role</span>
                <span style={{ color: '#d4d4d4' }}>: </span>
                <span style={{ color: '#ce9178' }}>"Lead"</span>
                <span style={{ color: '#d4d4d4' }}>, </span>
                <span style={{ color: '#9cdcfe' }}>pto</span>
                <span style={{ color: '#d4d4d4' }}>: </span>
                <span style={{ color: '#ce9178' }}>
                  "2026-03-10,2026-03-11"
                </span>
                <span style={{ color: '#d4d4d4' }}>)</span>
              </div>
              <div>
                <span style={{ color: '#4ec9b0' }}>$Bob</span>
                <span style={{ color: '#d4d4d4' }}>(</span>
                <span style={{ color: '#9cdcfe' }}>role</span>
                <span style={{ color: '#d4d4d4' }}>: </span>
                <span style={{ color: '#ce9178' }}>"Frontend"</span>
                <span style={{ color: '#d4d4d4' }}>, </span>
                <span style={{ color: '#9cdcfe' }}>workdays</span>
                <span style={{ color: '#d4d4d4' }}>: </span>
                <span style={{ color: '#ce9178' }}>"t,w,th,f,s"</span>
                <span style={{ color: '#d4d4d4' }}>)</span>
              </div>
              <div>
                <span style={{ color: '#4ec9b0' }}>$Carol</span>
                <span style={{ color: '#d4d4d4' }}>(</span>
                <span style={{ color: '#9cdcfe' }}>role</span>
                <span style={{ color: '#d4d4d4' }}>: </span>
                <span style={{ color: '#ce9178' }}>"QA"</span>
                <span style={{ color: '#d4d4d4' }}>)</span>
              </div>
              <br />
              <div style={{ color: '#6a9955' }}>
                # Tasks with three-point estimates (low likely high)
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>Requirements</span>{' '}
                <span style={{ color: '#b5cea8' }}>2 3 5</span>{' '}
                <span style={{ color: '#ce9178' }}>"Gather requirements"</span>
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>Architecture</span>{' '}
                <span style={{ color: '#b5cea8' }}>3 5 8</span>
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>API</span>{' '}
                <span style={{ color: '#b5cea8' }}>5 8 12</span>
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>UI</span>{' '}
                <span style={{ color: '#b5cea8' }}>4 6 10</span>
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>Database</span>{' '}
                <span style={{ color: '#b5cea8' }}>3 4 6</span>
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>Integration</span>{' '}
                <span style={{ color: '#b5cea8' }}>2 3 5</span>
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>Testing</span>{' '}
                <span style={{ color: '#b5cea8' }}>3 4 6</span>
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>Deploy</span>{' '}
                <span style={{ color: '#b5cea8' }}>1 1 2</span>
              </div>
              <br />
              <div style={{ color: '#6a9955' }}># Dependencies</div>
              <div>
                <span style={{ color: '#9cdcfe' }}>Requirements</span>{' '}
                <span style={{ color: '#c586c0' }}>&gt;</span>{' '}
                <span style={{ color: '#9cdcfe' }}>Architecture</span>
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>Architecture</span>{' '}
                <span style={{ color: '#c586c0' }}>&gt;</span>{' '}
                <span style={{ color: '#9cdcfe' }}>API, UI, Database</span>
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>API, Database</span>{' '}
                <span style={{ color: '#c586c0' }}>&gt;</span>{' '}
                <span style={{ color: '#9cdcfe' }}>Integration</span>
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>UI, Integration</span>{' '}
                <span style={{ color: '#c586c0' }}>&gt;</span>{' '}
                <span style={{ color: '#9cdcfe' }}>Testing</span>{' '}
                <span style={{ color: '#c586c0' }}>&gt;</span>{' '}
                <span style={{ color: '#9cdcfe' }}>Deploy</span>
              </div>
              <br />
              <div style={{ color: '#6a9955' }}># Assignments</div>
              <div>
                <span style={{ color: '#4ec9b0' }}>$Alice</span>{' '}
                <span style={{ color: '#c586c0' }}>&gt;</span>{' '}
                <span style={{ color: '#9cdcfe' }}>
                  Requirements, Architecture, API
                </span>
              </div>
              <div>
                <span style={{ color: '#4ec9b0' }}>$Bob</span>{' '}
                <span style={{ color: '#c586c0' }}>&gt;</span>{' '}
                <span style={{ color: '#9cdcfe' }}>UI</span>
              </div>
              <div>
                <span style={{ color: '#4ec9b0' }}>$Carol</span>{' '}
                <span style={{ color: '#c586c0' }}>&gt;</span>{' '}
                <span style={{ color: '#9cdcfe' }}>
                  Integration, Testing, Deploy
                </span>
              </div>
              <br />
              <div style={{ color: '#6a9955' }}># Clusters</div>
              <div>
                <span style={{ color: '#dcdcaa' }}>@planning</span>
                <span style={{ color: '#d4d4d4' }}>
                  : Requirements, Architecture
                </span>
              </div>
              <div>
                <span style={{ color: '#dcdcaa' }}>@build</span>
                <span style={{ color: '#d4d4d4' }}>: API, UI, Database</span>
              </div>
              <div>
                <span style={{ color: '#dcdcaa' }}>@quality</span>
                <span style={{ color: '#d4d4d4' }}>
                  : Integration, Testing, Deploy
                </span>
              </div>
              <br />
              <div style={{ color: '#6a9955' }}>
                # Milestone and date constraint
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>Deploy</span>{' '}
                <span style={{ color: '#c586c0' }}>&gt;</span>{' '}
                <span style={{ color: '#d7ba7d' }}>%Launch</span>
              </div>
              <div>
                <span style={{ color: '#9cdcfe' }}>Deploy</span>
                <span style={{ color: '#d4d4d4' }}>(</span>
                <span style={{ color: '#9cdcfe' }}>after</span>
                <span style={{ color: '#d4d4d4' }}>: </span>
                <span style={{ color: '#ce9178' }}>"2026-04-15"</span>
                <span style={{ color: '#d4d4d4' }}>)</span>
              </div>
            </code>
          </pre>
        </section>
      </div>
    </Modal>
  )
}
