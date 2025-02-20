import {Slider} from "@mui/material";

export function DataRangeSlider(props: {
    dataRangeChartStart: number, dataRangeChartEnd: number, numLines: number,
    onChange: (e: Event, newValue: number | number[]) => void
}) {
    return <Slider value={[props.dataRangeChartStart, props.dataRangeChartEnd]} min={0} max={props.numLines} step={10}
                   onChange={props.onChange}/>;
}