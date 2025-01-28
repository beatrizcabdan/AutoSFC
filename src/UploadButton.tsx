import React from "react";

export function UploadButton(props: { onClick: React.ChangeEventHandler<HTMLInputElement>, label: string }) {
    return <>
        {/*<input className={'button'} type={'button'} value={props.label}/>*/}
        <input type="file" id="input" onChange={props.onClick}/>
    </>
}