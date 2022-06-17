import React, {FC} from 'react'
import {useStore} from "../../store/store";
import {InputNumber} from "antd";


export const ScaleSelectors: FC = () => {
    const {positionScaleX, positionScaleY} = useStore()

    const onChangeX = (value: unknown) => {
        if (!value) {
            return
        }
        useStore.setState({positionScaleX: Number(value)})
    }

    const onChangeY = (value: unknown) => {
        if (!value) {
            return
        }
        useStore.setState({positionScaleY: Number(value)})
    }

    return (
        <>
            <InputNumber stringMode size="small" defaultValue={positionScaleX} step="0.1" addonBefore="X" style={{width: '90px', position: "absolute", right: 215, top: 10, zIndex: 5}} onChange={onChangeX}/>
            <InputNumber stringMode size="small" defaultValue={positionScaleY} step="0.1" addonBefore="Y" style={{width: '90px', position: "absolute", right: 115, top: 10, zIndex: 5}} onChange={onChangeY}/>
        </>
    )
}