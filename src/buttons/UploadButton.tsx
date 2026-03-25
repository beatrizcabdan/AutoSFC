import React, {useRef} from "react";
import './UploadButton.scss'
import {Button} from "@mui/material";

export function UploadButton(props: {
    onClick: React.ChangeEventHandler<HTMLInputElement>,
    label: string,
    currentFile?: string,
    getFileNameP?: boolean,
    getWrappingDiv?: boolean
}) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    function Content() {
        return <>
            <input ref={inputRef} type="file" className="upload-button-file-input" onChange={props.onClick} accept={'text/csv'}/>
            <Button className={'upload-button'} onClick={onClick}>{props.label}</Button>
            {props.getFileNameP && <p className={'upload-button-p'}>{props.currentFile ?? ''}</p>}
        </>
    }

    function onClick() {
        inputRef.current?.click()
    }

    return <>
        {props.getWrappingDiv
            ? <div className={'upload-button-container'}><Content/></div>
            : <Content/>}
    </>
}