import {FormEvent} from "react";
import {Slider} from "@mui/material";

export function PlaySlider(props: { min?: number, max?: number | undefined, onDrag: (e: Event, value: number | number[]) => void,
    value: number }) {

    return <Slider step={0.01} value={props.value} onChange={(e, value) => props.onDrag(e, value)}/>
    /*return <input className={'slider'} step={0.01} type={'range'} value={props.value} onInput={e =>
        props.onDrag(e)}/>*/
}