import React from "react";

export function Slider(props: { min?: number, max?: number | undefined, onDrag: () => void }) {
    return <input className={'slider'} type={'range'}/>
}