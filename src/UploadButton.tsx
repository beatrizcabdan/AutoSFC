import React, {useRef} from "react";
import './UploadButton.scss'

export function UploadButton(props: { onClick: React.ChangeEventHandler<HTMLInputElement>, label: string,
    currentFile?: string }) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    function onClick() {
        inputRef.current?.click()
    }

    return <div className={'upload-button-container'}>
        <input ref={inputRef} type="file" className="file-input" onChange={props.onClick} accept={'text/csv'}/>
        <button className={'button'} onClick={onClick}>{props.label}</button>
        <p>{props.currentFile ?? ''}</p>
    </div>
}