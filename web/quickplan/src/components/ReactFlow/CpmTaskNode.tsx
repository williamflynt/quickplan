import React, {FC, memo} from 'react'
import {Handle, Node, NodeProps, Position} from 'react-flow-renderer'
import {Col, Row, Space, Statistic, Tooltip, Typography} from "antd";
import {ChartNode} from "../../api/types";

type CpmNodeData = {
    label: string
    description?: string
    cpm: {
        duration: number
        earlyStart: number
        earlyFinish: number
        lateStart: number
        lateFinish: number
        slack: number
    }
}

type CpmNodeProps = NodeProps<CpmNodeData>

export const ChartNodeToCpmTask = (n: ChartNode): Node<CpmNodeData> => {
    return {
        id: n.id,
        type: 'cpmTask',
        data: {
            label: n.label,
            cpm: {
                duration: n.duration,
                earlyStart: n.earliestStart,
                earlyFinish: n.earliestFinish,
                lateStart: n.latestStart,
                lateFinish: n.latestFinish,
                slack: n.slack
            }
        },
        // Scale positions to avoid clustering.
        position: {x: n.position.x * 2, y: n.position.y * 3.5},
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
                return <Col>{c || 0}</Col>
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

const CpmTaskNode: FC<CpmNodeProps> = (props) => {
    const bottomRowComponents = [props.data.cpm.lateStart, props.data.cpm.slack, props.data.cpm.lateFinish]
    const topRowComponents = [props.data.cpm.earlyStart, props.data.cpm.duration, props.data.cpm.earlyFinish]

    const outerStyles = {
        border: '1px solid #bbb',
        padding: '5px',
        borderRadius: '5px',
        background: '#fff',
        width: '150px'
    }

    return (
        <div style={outerStyles}>
            <Handle type="target" position={Position.Left} isConnectable/>
            <CpmDataRow type="earlyNums"
                        left={topRowComponents[0]}
                        center={topRowComponents[1]}
                        right={topRowComponents[2]}/>

            <Row justify="space-around"><Col><Typography.Text strong>{props.data?.label}</Typography.Text></Col></Row>

            <CpmDataRow type="lateNums"
                        left={bottomRowComponents[0]}
                        center={bottomRowComponents[1]}
                        right={bottomRowComponents[2]}/>
            <Handle type="source" position={Position.Right} isConnectable/>
        </div>
    )
}

CpmTaskNode.displayName = 'CpmTaskNode'

export default memo(CpmTaskNode)