import {Slider} from "@mui/material";
import './DataRangeSlider.scss'
import App from "../App.module.scss";

const {primaryColor} = App

export function DataRangeSlider(props: {
    dataRangeChartStart: number,
    dataRangeChartEnd: number,
    numLines: number,
    onChange: (e: Event, newValue: number | number[]) => void,
    idx?: number,
    lineColors?: string[],
    color?: string
}) {
    return <Slider value={[props.dataRangeChartStart, props.dataRangeChartEnd]} min={0} max={props.numLines} step={10}
                   color={'primary'} onChange={props.onChange} sx={{color: props.color ?? primaryColor}}/>;
}