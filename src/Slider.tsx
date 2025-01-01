import React, {FormEvent} from "react";

export function Slider(props: { min?: number, max?: number | undefined, onDrag: (e: FormEvent<HTMLInputElement>) => void,
    initialVal: number }) {
    return <input className={'slider'} step={0.01} type={'range'} defaultValue={props.initialVal} onInput={e =>
        props.onDrag(e)}/>
}