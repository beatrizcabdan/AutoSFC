import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// noinspection TypeScriptValidateTypes
import './App.scss';
import { useEffect, useRef, useState } from 'react';
import { Chart } from "./Chart.tsx";
import { Slider } from "./Slider.tsx";
import { PlayButton } from "./PlayButton.tsx";
import { SelectColumnsDialog } from "./SelectColumnsDialog.tsx";
const demoPreset1 = {
    dataPointInterval: 1,
    dataRangeStart: 0,
    dataRangeEnd: -1,
    lineDataSmoothing: 0
};
const demoPreset2 = {
    dataPointInterval: 5,
    dataRangeStart: 13000,
    dataRangeEnd: 14000,
    lineDataSmoothing: 1.0
};
const demoPreset3 = {
    dataPointInterval: 5,
    dataRangeStart: 63000,
    dataRangeEnd: 64000,
    lineDataSmoothing: 1.0
};
const demoPreset4 = {
    dataPointInterval: 1,
    dataRangeStart: 1000,
    dataRangeEnd: 1020,
    lineDataSmoothing: 0
};
const paperPreset = {
    dataPointInterval: 1,
    dataRangeStart: 720,
    dataRangeEnd: 880,
    lineDataSmoothing: 0
};
const preset = paperPreset;
export var PlayStatus;
(function (PlayStatus) {
    PlayStatus[PlayStatus["PLAYING"] = 0] = "PLAYING";
    PlayStatus[PlayStatus["PAUSED"] = 1] = "PAUSED";
    PlayStatus[PlayStatus["REACHED_END"] = 2] = "REACHED_END";
})(PlayStatus || (PlayStatus = {}));
function App() {
    const FILE_PATH = 'src/assets/opendlv.device.gps.pos.Grp1Data-0-excerpt.csv';
    const DATA_POINT_INTERVAL = preset.dataPointInterval;
    const SLIDER_START_VAL = 0;
    const [startValue, setStartValue] = useState(preset.dataRangeStart);
    const [endValue, setEndValue] = useState(preset.dataRangeEnd);
    const [displayedDataLabels, setDisplayedDataLabels] = useState(['accel_trans', 'accel_down']);
    const [data, setData] = useState([]);
    const [startTimeXticks, setStartTime] = useState();
    const [finshTimeXticks, setFinshTime] = useState();
    const allDataLabelsRef = useRef([]);
    const [minChartValue, setMinChartValue] = useState();
    const [maxChartValue, setMaxChartValue] = useState();
    const [signalMarkerPos, setSignalMarkerPos] = useState(SLIDER_START_VAL);
    const [playStatus, setPlayStatus] = useState(PlayStatus.PAUSED);
    const playbackIntervalRef = useRef(-1);
    const [showDialog, setShowDialog] = useState(false);
    useEffect(() => {
        fetch(FILE_PATH).then(r => {
            r.text().then(t => {
                const lines = t
                    .trim()
                    .split(/\n/);
                const dataLabels = lines[0]
                    .split(/;/);
                allDataLabelsRef.current = dataLabels;
                const colIndices = displayedDataLabels.map(label => dataLabels
                    .findIndex(col => col === label)).filter(index => index !== -1);
                const beginTime = Number(lines[1]?.split(/;/)[0]);
                let startTimeXticks = Number(lines[startValue + 1]?.split(/;/)[0]);
                let finshTimeXticks = Number(endValue < lines.length ? lines[endValue + 1]?.split(/;/)[0] : undefined);
                startTimeXticks = startTimeXticks - beginTime;
                finshTimeXticks = finshTimeXticks - beginTime;
                const newData = [];
                let minData = Infinity;
                let maxData = 0;
                colIndices.forEach(index => {
                    const column = lines
                        .slice(1) // Skip headers
                        .slice(startValue >= 0 ? startValue : 0, endValue >= 0 ? endValue : undefined)
                        .map(l => l.split(/;/))
                        .map(arr => Number(arr[index])) //will only work for accelerations! otherwise arr => Number(arr[index])
                        .filter((_, i) => i % DATA_POINT_INTERVAL == 0);
                    newData.push(column);
                    const sortedData = [...column].sort((a, b) => a - b);
                    minData = Math.min(minData, sortedData[0]);
                    maxData = Math.max(maxData, sortedData[sortedData.length - 1]);
                });
                setData(newData);
                setStartTime(startTimeXticks);
                setFinshTime(finshTimeXticks);
                setMinChartValue(minData);
                setMaxChartValue(maxData);
            });
        });
    }, [startValue, endValue, displayedDataLabels]);
    const onSliderDrag = (e) => {
        if (playStatus === PlayStatus.PLAYING) {
            clearInterval(playbackIntervalRef.current);
            setPlayStatus(PlayStatus.PAUSED);
        }
        else {
            setPlayStatus(e.currentTarget.value >= 100 ? PlayStatus.REACHED_END : PlayStatus.PAUSED);
        }
        setSignalMarkerPos(e.currentTarget.value);
    };
    const onRangeChange = (e) => {
        if (startValue < 0 || endValue > data.length || startValue >= endValue) {
            return;
        }
        setStartTime(startValue);
        setEndValue(endValue);
    };
    // Stop playback when reaching end
    useEffect(() => {
        if (playStatus === PlayStatus.PLAYING && signalMarkerPos >= 100) {
            clearInterval(playbackIntervalRef.current);
            setSignalMarkerPos(100);
            setPlayStatus(PlayStatus.REACHED_END);
        }
    }, [signalMarkerPos]);
    // Clear interval when unmounting the component
    useEffect(() => {
        return () => clearInterval(playbackIntervalRef.current);
    }, []);
    function startPlayback() {
        playbackIntervalRef.current = setInterval(() => {
            setSignalMarkerPos((signalMarkerPos) => Number(signalMarkerPos) + 0.1);
        }, 20);
    }
    const onPlayClick = () => {
        switch (playStatus) {
            case PlayStatus.PAUSED:
                setPlayStatus(PlayStatus.PLAYING);
                startPlayback();
                break;
            case PlayStatus.PLAYING:
                setPlayStatus(PlayStatus.PAUSED);
                clearInterval(playbackIntervalRef.current);
                break;
            case PlayStatus.REACHED_END:
                setPlayStatus(PlayStatus.PLAYING);
                setSignalMarkerPos(0);
                startPlayback();
        }
    };
    const selectDataColumns = () => {
        if (!showDialog) {
            setShowDialog(true);
        }
    };
    const setDataLabels = (labels) => {
        setDisplayedDataLabels(labels);
        setShowDialog(false);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "topnav", children: [_jsx("a", { className: "active", href: "#demo", children: "Demo" }), _jsx("a", { href: "#work", children: "Previous work" }), _jsx("a", { href: "#contact", children: "Contact" }), _jsx("a", { href: "#about", children: "About SFCs" })] }), _jsxs("div", { id: 'main', children: [_jsxs("div", { className: 'charts', children: [_jsx(Chart, { name: 'Original signals plot', data: data, minValue: minChartValue, maxValue: maxChartValue, type: 'line', xAxisName: 'Time', yAxisName: 'Acceleration', yAxisLabelPos: 'left', legendLabels: displayedDataLabels, startTimeXticks: startTimeXticks, finshTimeXticks: finshTimeXticks, currentSignalXVal: signalMarkerPos, lineDataSmoothing: preset.lineDataSmoothing, onLegendClick: selectDataColumns }), _jsx(Chart, { name: 'Morton plot (with bars)', data: data, minValue: minChartValue, maxValue: maxChartValue, type: 'scatter', xAxisName: 'Morton', yAxisName: 'Time steps', yAxisLabelPos: 'right', currentSignalXVal: signalMarkerPos })] }), _jsxs("div", { className: 'play-controls', children: [_jsx(PlayButton, { onClick: onPlayClick, status: playStatus }), _jsx(Slider, { min: 0, max: data?.length, onDrag: onSliderDrag, value: signalMarkerPos }), _jsxs("div", { className: 'input-controls', children: [_jsxs("label", { children: ["Start Value:", _jsx("input", { type: "number", value: startValue, onChange: (e) => setStartValue(Number(e.target.value)) })] }), "\u00A0", _jsxs("label", { children: ["End Value:", _jsx("input", { type: "number", value: endValue, onChange: (e) => setEndValue(Number(e.target.value)) })] })] })] })] }), _jsx("div", { className: "tabcontent" }), _jsx("div", { className: "footer", children: "Demo of SFC encoding and barcode formation for automotive data." }), _jsx(SelectColumnsDialog, { show: showDialog, setShow: setShowDialog, currentLabels: displayedDataLabels, dataLabelsRef: allDataLabelsRef, setDataLabels: setDataLabels })] }));
}
export default App;
