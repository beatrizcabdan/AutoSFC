import React from "react";
import {DEFAULT_SCALING_FACTOR} from "./App.tsx";

export function ProcessingComponent(props: { displayedDataLabels: string[] | null, lineColors: string[], scales: (number | undefined)[],
    onScalesChanged: (index: number, scale: (number | undefined)) => void, onOffsetsChanged: (index: number, offset: number) => void
}) {
    return <div className={'control-container'} id={'process-container'}>
        <h3>Scale/transform</h3>
        <div className={'signal-rows'}>
            {props.displayedDataLabels?.map((signal, i) =>
                <div className={'signal-row'} key={i}>
                    <span style={{background: props.lineColors[i]}} className={'color-line'}></span>
                    <span className={'signal-name'}>{signal}</span>
                    <label className={'input-label'}>
                        Offset
                        <input type="number" value={0}
                               onChange={(e) => props.onOffsetsChanged(i, Number(e.target.value))}/>
                    </label>
                    <label className={'input-label'}>
                        Scale
                        <input type="number" value={props.scales[i]} onBlur={() =>
                            props.onScalesChanged(i, Number(props.scales[i] ?? DEFAULT_SCALING_FACTOR))}
                               onChange={(e) =>
                                   props.onScalesChanged(i, e.target.value ? Number(e.target.value) : undefined)}/>
                    </label>
                </div>
            )}
        </div>
    </div>;
}