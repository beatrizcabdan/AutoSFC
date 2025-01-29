import {FormEvent} from "react";

export function Slider(props: { min?: number, max?: number | undefined, onDrag: (e: FormEvent<HTMLInputElement>) => void,
    value: number }) {

    return <input className={'slider'} step={0.01} type={'range'} value={props.value} onInput={e =>
        props.onDrag(e)}/>
}