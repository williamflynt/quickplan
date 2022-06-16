import React, {FC, memo} from 'react'
import {Handle, Node, NodeProps, Position} from 'react-flow-renderer'
import {Col, Row, Tooltip, Typography} from "antd";
import {ChartNode} from "../../api/types";
import {useStore} from "../../store/store";

export type CpmNodeData = {
    label: string
    description?: string
    cpm: {
        duration: number
        durationLow: number,
        durationLikely: number,
        durationHigh: number,
        earlyStart: number
        earlyFinish: number
        lateStart: number
        lateFinish: number
        slack: number
    }
}

export type CpmNodeType = Node<CpmNodeData>

export const ChartNodeToCpmTask = (n: ChartNode): CpmNodeType => {
    return {
        id: n.id,
        type: 'cpmTask',
        data: {
            label: n.title,
            cpm: {
                duration: n.duration,
                durationLow: n.durationLow,
                durationLikely: n.durationLikely,
                durationHigh: n.durationHigh,
                earlyStart: n.earliestStart,
                earlyFinish: n.earliestFinish,
                lateStart: n.latestStart,
                lateFinish: n.latestFinish,
                slack: n.slack
            }
        },
        // Scale positions to avoid clustering.
        position: {x: n.position.x * 2.3, y: n.position.y * 3.5},
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
    }
}

type DataRowProps = {
    border: 'top' | 'bottom' | 'both' | 'none'
    components: React.ReactNode[]
}

const DataRow: FC<DataRowProps> = ({border, components}) => {
    const styles: Record<string, string> = {background: '#fff'}
    const borderString = '1px solid #bbb'
    if (border === 'top' || border === 'both') {
        styles.borderTop = borderString
    }
    if (border === 'bottom' || border === 'both') {
        styles.borderBottom = borderString
    }

    return (
        <Row style={styles} justify="space-around">
            {components.map((c, i) => {
                const key = c ? `${i}-${c.toString()}` : `${i}-falsy`
                return <Col key={key}>{c || 0}</Col>
            })}
        </Row>
    )
}

type CpmDataElementTitleProps = { title: string, pos: 'top' | 'bottom', leftOffset: number }

const CpmDataElementTitle: FC<CpmDataElementTitleProps> = ({title, pos, leftOffset}) => {
    return (<Typography.Text type="secondary" style={{
        fontSize: '0.5em',
        position: 'absolute',
        whiteSpace: 'nowrap',
        [pos]: -5,
        left: leftOffset,
    }}>{title}</Typography.Text>)
}

type CpmDataElementProps = { title: string, titlePos: 'top' | 'bottom', value: string | number, color?: string }

const CpmDataElement: FC<CpmDataElementProps> = (props) => {
    // Empirically determined "okay" offsets.
    const baseOffset = -props.title.length + 5
    const leftOffset = props.value.toString().length >= 2 ? baseOffset : baseOffset - 6

    const titleElem = <CpmDataElementTitle title={props.title} pos={props.titlePos} leftOffset={leftOffset}/>
    return (
        <Typography.Text style={{color: props.color}}>{titleElem}{props.value}</Typography.Text>
    )
}

type CpmDataRowProps = {
    type: 'earlyNums' | 'lateNums'
    left: string | number
    center: string | number
    right: string | number
}

/**
 * CpmDataRow is a row on the top or bottom of the CpmTaskNode with early/late
 * start and finish, plus slack or duration.
 * @param type
 * @param left
 * @param center
 * @param right
 * @constructor
 */
const CpmDataRow: FC<CpmDataRowProps> = ({type, left, center, right}) => {
    const border = type === 'earlyNums' ? 'bottom' : 'top'
    const titlePos = type === 'earlyNums' ? 'top' : 'bottom'
    // Color early times green, and latest times red.
    const edgeTextColor = type === 'earlyNums' ? '#118811' : '#cc5511'
    // Color positive slack blue.
    const centerTextColor = type === 'earlyNums' ? undefined : '#0077dd'

    const leftTitle = type === 'earlyNums' ? 'Earliest Start' : 'Latest Start'
    const centerTitle = type === 'earlyNums' ? 'Duration' : 'Slack'
    const rightTitle = type === 'earlyNums' ? 'Earliest Finish' : 'Latest Finish'

    const leftElem = <CpmDataElement title={leftTitle} titlePos={titlePos} value={left} color={edgeTextColor}/>
    const centerElem = <CpmDataElement title={centerTitle} titlePos={titlePos} value={center} color={centerTextColor}/>
    const rightElem = <CpmDataElement title={rightTitle} titlePos={titlePos} value={right} color={edgeTextColor}/>
    return <DataRow border={border} components={[leftElem, centerElem, rightElem]}/>
}

type CpmNodeProps = NodeProps<CpmNodeData>

/**
 * NodeTextComponent is the center, bolded display label of the Node in React Flow.
 * @param data
 * @constructor
 */
const NodeTextComponent: FC<{ data: CpmNodeProps }> = ({data}) => {
    const labelComponent = <Typography.Text strong
                                            style={{fontSize: '0.8em'}}>{data.data.label || data.id}</Typography.Text>
    return (
        <Tooltip title={`${data.id}: ${data.data.description || 'No description.'}`}>
            <div style={{whiteSpace: 'nowrap', overflow: 'hidden'}}>
                {labelComponent}
            </div>
        </Tooltip>
    )
}

const CpmTaskNode: FC<CpmNodeProps> = (props) => {
    const {activeNodeId} = useStore()

    const toggleNodeActive = () => {
        if (activeNodeId === props.id) {
            useStore.setState({activeNodeId: null})
            return
        }
        useStore.setState({activeNodeId: props.id, nodeToolsVisible: true})
    }

    const bottomRowComponents = [props.data.cpm.lateStart, props.data.cpm.slack, props.data.cpm.lateFinish]
    const topRowComponents = [props.data.cpm.earlyStart, props.data.cpm.duration, props.data.cpm.earlyFinish]

    const className = activeNodeId === props.id ? "cpm-node-active" : "cpm-node"

    return (
        <div className={className} onClick={toggleNodeActive}>
            <Handle type="target" position={Position.Left} style={{width: '12px', height: '12px', left: -5}}
                    isConnectable/>
            <CpmDataRow type="earlyNums"
                        left={topRowComponents[0]}
                        center={topRowComponents[1]}
                        right={topRowComponents[2]}/>

            <Row justify="space-around"><Col><NodeTextComponent data={props}/></Col></Row>

            <CpmDataRow type="lateNums"
                        left={bottomRowComponents[0]}
                        center={bottomRowComponents[1]}
                        right={bottomRowComponents[2]}/>
            <Handle type="source" position={Position.Right} style={{width: '12px', height: '12px', right: -5}}
                    isConnectable/>
        </div>
    )
}

CpmTaskNode.displayName = 'CpmTaskNode'

export default memo(CpmTaskNode)