import {FC, RefObject} from "react";

type MonacoProps = {
    editorRef: RefObject<HTMLDivElement | null>
    style?: React.CSSProperties
}

export const Monaco: FC<MonacoProps> = ({editorRef, style}) => {
    return <div ref={editorRef} id="monaco-editor-root" style={style} />
}