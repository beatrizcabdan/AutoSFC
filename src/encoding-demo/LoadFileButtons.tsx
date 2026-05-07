import React, {useRef} from "react";
import {Button, ButtonGroup} from "@mui/material";
import '../buttons/buttons.scss'
import './LoadFileButtons.scss'

export function LoadFileButtons(props: {
    onUploadButtonClick: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onLoadUrlButtonClick: () => void,
    currentFile: string
}) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    function onClick() {
        inputRef.current?.click()
    }

    return <>
                <input ref={inputRef} type="file" className="upload-button-file-input" onChange={props.onUploadButtonClick} accept={'text/csv'}/>
                <ButtonGroup className={'load-file-buttons'}>
                    <Button onClick={onClick} className={'button'}>Upload file...</Button>
                    <Button onClick={props.onLoadUrlButtonClick} className={'button'}>Load URL...</Button>
                </ButtonGroup>
                <p className={'upload-button-p'}>{props.currentFile ?? ''}</p>
        </>
}