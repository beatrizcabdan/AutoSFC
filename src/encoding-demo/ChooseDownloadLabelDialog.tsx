import {Dialog} from "../dialog/Dialog.tsx";
import {Button, TextField} from "@mui/material";
import './EncodingDemo.scss'
import './ChooseDownloadLabelDialog.scss'
import React, {useState} from "react";

export function ChooseDownloadLabelDialog(props: {
    show: boolean,
    onCancel: () => void,
    onChoose: (label: string) => void
}) {
    const [currentLabel, setCurrentLabel] = useState('')

    const onChooseLabel = () => {
        props.onChoose(currentLabel)
        setCurrentLabel('')
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'Enter') {
            onChooseLabel()
        }
    }

    return <Dialog show={props.show} title={'Give an optional label to the downloaded data'} setHide={props.onCancel}
                   className={'choose-label-dialog'}>
        <>
            <TextField variant={'filled'} size={'medium'} onChange={e => setCurrentLabel(e.target.value)}
                       onKeyDown={e => onKeyDown(e)}
                       value={currentLabel} fullWidth inputRef={input => input && input.focus()} autoComplete={'false'} autoSave={'false'}/>
            <div className={'dialog-buttons choose-label-buttons'}>
                <Button className={'cancel-button'} onClick={props.onCancel}>Skip</Button>
                <Button className={'add-label-button'} // @ts-ignore
                        onClick={() => onChooseLabel()}>Add label</Button>
            </div>
        </>
    </Dialog>
}