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

    function inputIsCorrect() {
        // URL
        // TODO: contentHash only allowed search param
        return currentUrl === '' || !!currentUrl.match(/(?:http[s]?:\/\/.)?(?:www\.)?[-a-zA-Z0-9@%._+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_+.~#?&\/=]*/)
    }

    return <Dialog show={props.show} title={'Insert URL of remote file to load'} setHide={props.hide}
                   className={'load-remote-file-dialog'} onHide={() => setCurrentUrl('')}>
        <>
            <p>File content hash may be appended as search parameter as well.</p>
            <TextField variant={'filled'} size={'medium'} onChange={e => setCurrentUrl(e.target.value)}
                       onKeyDown={e => onKeyDown(e)} error={!inputIsCorrect()}
                       placeholder={'https://wwww.example.com/example-data.csv&contentHash=bcc82e3a4b6877e31cbc5ca142b7873b'}
                       helperText={inputIsCorrect() ? ' ' : 'Incorrect URL format.'}
                       value={currentUrl} fullWidth inputRef={input => input && input.focus()} autoComplete={'false'} autoSave={'false'}/>
            <div className={'dialog-buttons'}>
                <Button className={'cancel-button'} onClick={props.onCancel}>Cancel</Button>
                <Button className={'load-url-button'} // @ts-ignore
                        onClick={() => props.onFileChosen(currentUrl)}>Load file</Button>
            </div>
        </>
    </Dialog>;
}