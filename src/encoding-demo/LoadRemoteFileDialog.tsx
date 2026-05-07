import {Dialog} from "../dialog/Dialog.tsx";
import {Button, TextField} from "@mui/material";
import React, {useState} from "react";
import './LoadRemoteFileDialog.scss'

export function LoadRemoteFileDialog(props: {
    show: boolean,
    onFileChosen: (url: string) => void,
    onCancel: () => void,
    hide: () => void
}) {
    const [currentUrl, setCurrentUrl] = useState('')

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'Enter') {
            props.onFileChosen(currentUrl)
        }
    }

    return <Dialog show={props.show} title={'Insert URL of remote file to load'} setHide={props.hide} className={'load-remote-file-dialog'}>
        <>
            <TextField variant={'filled'} size={'medium'} onChange={e => setCurrentUrl(e.target.value)}
                       onKeyDown={e => onKeyDown(e)} /*color={'success'}*/ placeholder={'https://wwww.example.com/example-data.csv'}
                       value={currentUrl} fullWidth inputRef={input => input && input.focus()} autoComplete={'false'} autoSave={'false'}/>
            <div className={'dialog-buttons'}>
                <Button className={'cancel-button'} onClick={props.onCancel}>Cancel</Button>
                <Button className={'load-url-button'} // @ts-ignore
                        onClick={() => props.onFileChosen(currentUrl)}>Load file</Button>
            </div>
        </>
    </Dialog>;
}