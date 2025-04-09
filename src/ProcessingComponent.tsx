import React from "react";
import {DEFAULT_BITS_PER_SIGNAL, DEFAULT_SCALING_FACTOR} from "./App.tsx";
import {Checkbox} from "@mui/material";

export function ProcessingComponent(props: {
    displayedDataLabels: string[] | null,
    lineColors: string[],
    scales: (number | undefined)[],
    onScalesChanged: (index: number, scale: (number | undefined)) => void,
    onOffsetsChanged: (index: number, offset: (number | undefined)) => void,
    offsets: (number | undefined)[],
    bitsPerSignal: number | string,
    onBitsPerSignalChanged: (bits: number | string) => void
}) {
    return <div className={'control-container'} id={'process-container'}>
        <h3>Transform</h3>
        <div className={'signals-grid'}>
            <span className={'input-label signal-label'}>Signal</span>
            <span className={'input-label offset-label'}>Offset</span>
            <span className={'input-label scale-label'}>Scale</span>
            {props.displayedDataLabels?.map((signal, i) =>
                <React.Fragment key={i}>
                    <div className={'signal-cell'} key={i}>
                        <span style={{background: props.lineColors[i % props.lineColors.length]}} className={'color-line'}></span>
                        <span className={'signal-name'}>{signal}</span>
                    </div>
                    <label className={'input-label offset-label'}>
                        <input type="number" value={props.offsets[i]} onBlur={() =>
                            props.onOffsetsChanged(i, Number(props.offsets[i] ?? 0))}
                               onChange={(e) =>
                                   props.onOffsetsChanged(i, e.target.value ? Number(e.target.value) : undefined)}/>
                    </label>
                    <label className={'input-label scale-label'}>
                        <input type="number" value={props.scales[i]} onBlur={() =>
                            props.onScalesChanged(i, Number(props.scales[i] ?? DEFAULT_SCALING_FACTOR))}
                               onChange={(e) =>
                                   props.onScalesChanged(i, e.target.value ? Number(e.target.value) : undefined)}/>
                    </label>
                </React.Fragment>
            )}
            <span className={'input-label bits-label'}>Bits per signal</span>
            <label className={'input-label bits-label'}>
                <input type={'number'} value={props.bitsPerSignal} min={0}
                       onBlur={() =>
                           props.onBitsPerSignalChanged(Number(props.bitsPerSignal === '' ? DEFAULT_BITS_PER_SIGNAL : props.bitsPerSignal))}
                       onChange={(e) =>
                           props.onBitsPerSignalChanged(e.target.value ? Number(e.target.value) : '')}/>
            </label>
            <span className={'input-label show-transforms-label'}>Show transforms in signals chart</span>
            <div className={'input-label show-transforms-label'}>
                <Checkbox size={'small'} onChange={() => console.log('Click!')}/>
            </div>
        </div>
    </div>;
}