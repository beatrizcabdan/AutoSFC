/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-unused-vars,no-unused-vars */
// noinspection JSUnusedLocalSymbols

import './App.scss'

import {ChangeEvent, FormEvent, useEffect, useRef, useState} from 'react';
import {Chart} from "./Chart.tsx";
import {Slider} from "./Slider.tsx";
import {PlayButton} from "./PlayButton.tsx";
import {SelectColumnsDialog} from "./SelectColumnsDialog.tsx";
import {UploadButton} from "./UploadButton.tsx";
import {debounce} from "./utils.ts";

const demoPreset1 = {
    dataPointInterval: 1,
    dataRangeStart: 0,
    dataRangeEnd: -1,
    lineDataSmoothing: 0
}

const demoPreset2 = {
    dataPointInterval: 5,
    dataRangeStart: 13000,
    dataRangeEnd: 14000,
    lineDataSmoothing: 1.0
}

const demoPreset3 = {
    dataPointInterval: 5,
    dataRangeStart: 63000,
    dataRangeEnd: 64000,
    lineDataSmoothing: 1.0
}

const demoPreset4 = {
    dataPointInterval: 1,
    dataRangeStart: 1000,
    dataRangeEnd: 1020,
    lineDataSmoothing: 0
}

const paperPreset = {
    dataPointInterval: 1,
    dataRangeStart: 720,
    dataRangeEnd: 880,
    lineDataSmoothing: 0
}

const preset = paperPreset

// eslint-disable-next-line react-refresh/only-export-components
export enum PlayStatus {
    PLAYING, PAUSED, REACHED_END
}

function App() {
    const SLIDER_START_VAL = 0
    const EXAMPLE_FILE_PATH = './opendlv.device.gps.pos.Grp1Data-0-excerpt.csv'

    const [filePath, setFilePath] = useState(EXAMPLE_FILE_PATH)
    const [fileName, setFileName] = useState(EXAMPLE_FILE_PATH)
    const DATA_POINT_INTERVAL  = preset.dataPointInterval

    const [startValue, setStartValue] = useState(preset.dataRangeStart)
    const [endValue, setEndValue] = useState(preset.dataRangeEnd);
    const [displayedDataLabels, setDisplayedDataLabels] = useState<string[] | null>(['accel_trans', 'accel_lon'])

    const [data, setData] = useState<number[][]>([])
    const [startTimeXticks, setStartTime] = useState<number>()
    const [finshTimeXticks, setFinshTime] = useState<number>()
    const allDataLabelsRef = useRef<string[]>([])
    const [minChartValue, setMinChartValue] = useState<number>(-1)
    const [maxChartValue, setMaxChartValue] = useState<number>(-1)

    const [signalMarkerPos, setSignalMarkerPos] = useState<number>(SLIDER_START_VAL)
    const [playStatus, setPlayStatus] = useState(PlayStatus.PAUSED)
    const playbackIntervalRef = useRef(-1)

    const [showDialog, setShowDialog] = useState(false)

    const loadFile = () => {
        fetch(filePath).then(r => {
            r.text().then(t => {
                const lines = t
                    .trim()
                    .split(/;?\n/)
                const dataLabels = lines[0]
                    .split(/;/)
                allDataLabelsRef.current = dataLabels
                const colIndices = displayedDataLabels?.map(label => dataLabels
                    .findIndex(col => col === label)
                ).filter(index => index !== -1) ?? [dataLabels.length - 2, dataLabels.length - 1]

                const beginTime = Number(lines[1]?.split(/;/)[0]) * 1000000 + Number(lines[1]?.split(/;/)[1]);
                let startTimeXticks = Number(0 < startValue ? Number(lines[startValue + 1]?.split(/;/)[0]) * 1000000 + Number(lines[startValue + 1]?.split(/;/)[1]) : beginTime);
                let finishTimeXticks = Number(-1 < endValue && (endValue < lines.length - 1) ? Number(lines[endValue + 1]?.split(/;/)[0]) * 1000000 + Number(lines[endValue + 1]?.split(/;/)[1]) : Number(lines[lines.length - 1]?.split(/;/)[0]) * 1000000 + Number(lines[lines.length - 1]?.split(/;/)[1]));
                startTimeXticks = (startTimeXticks - beginTime) / 1000000;
                finishTimeXticks = (finishTimeXticks - beginTime) / 1000000;

                const newData: number[][] = []
                let minData = Infinity
                let maxData = 0
                colIndices.forEach(index => {
                    const column: number[] = lines
                        .slice(1) // Skip headers
                        .slice(startValue >= 0 ? startValue : 0,
                            endValue >= 0 ? endValue : undefined)
                        .map(l => l.split(/;/))
                        .map(arr => Number(arr[index]))
                        .filter((_, i) => i % DATA_POINT_INTERVAL == 0)
                    newData.push(column)

                    const sortedData = [...column].sort((a, b) => a - b)
                    minData = Math.min(minData, sortedData[0])
                    maxData = Math.max(maxData, sortedData[sortedData.length - 1])
                })

                setData(newData)
                setStartTime(startTimeXticks)
                setFinshTime(finishTimeXticks)
                setMinChartValue(minData)
                setMaxChartValue(maxData)
            })
        })
    }

    onresize = debounce(loadFile, 200)

    useEffect(() => {
        loadFile()
    }, [startValue, endValue, displayedDataLabels, filePath]);

    const onSliderDrag = (e: FormEvent<HTMLInputElement>) => {
        if (playStatus === PlayStatus.PLAYING) {
            clearInterval(playbackIntervalRef.current)
            setPlayStatus(PlayStatus.PAUSED)
        } else {
            // @ts-expect-error
            setPlayStatus(e.currentTarget.value >= 100 ? PlayStatus.REACHED_END : PlayStatus.PAUSED)
        }
        // @ts-ignore
        setSignalMarkerPos(e.currentTarget.value)
    }

    // Stop playback when reaching end
    useEffect(() => {
        if (playStatus === PlayStatus.PLAYING && signalMarkerPos >= 100) {
            clearInterval(playbackIntervalRef.current)
            setSignalMarkerPos(100)
            setPlayStatus(PlayStatus.REACHED_END)
        }
    }, [signalMarkerPos])

    // Clear interval when unmounting the component
    useEffect(() => {
        return () => clearInterval(playbackIntervalRef.current);
    }, []);

    function startPlayback() {
        playbackIntervalRef.current = setInterval(() => {
                setSignalMarkerPos((signalMarkerPos) => Number(signalMarkerPos) + 0.1)
            },
            20)
    }

    const onPlayClick = () => {
        switch (playStatus) {
            case PlayStatus.PAUSED:
                setPlayStatus(PlayStatus.PLAYING)
                startPlayback();
                break
            case PlayStatus.PLAYING:
                setPlayStatus(PlayStatus.PAUSED)
                clearInterval(playbackIntervalRef.current)
                break
            case PlayStatus.REACHED_END:
                setPlayStatus(PlayStatus.PLAYING)
                setSignalMarkerPos(0)
                startPlayback()
        }
    }

    const selectDataColumns = () => {
        if (!showDialog) {
            setShowDialog(true)
        }
    };

    const setDataLabels = (labels: string[]) => {
        setDisplayedDataLabels(labels)
        setShowDialog(false)
    }

    function uploadFile(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.item(0)
        if (file?.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result?.toString();
                if (text) {
                    const lines = text
                        .trim()
                        .split(/;?\n/)
                    const dataLabels = lines[0]
                        .split(/;/)
                    setDisplayedDataLabels(dataLabels.slice(dataLabels.length - 2))
                    setStartValue(0)
                    setEndValue(lines.length - 2) // -1 due to header row
                    const url = URL.createObjectURL(file)
                    setFileName(file.name)
                    setFilePath(url)
                } else {
                    alert("Error reading the file. Please try again.");
                }
            };
            reader.onerror = () => {
                alert("Error reading the file. Please try again.");
            };
            reader.readAsText(file);
        }
    }

    return (
        <>
            {/*<div className="header">*/}
            {/*    <h2 className="header-text"></h2>*/}
            {/*    <img src="assets/logo1.png" alt="AutoSFC logo" className="header-img"/>*/}
            {/*</div>*/}
            <div className="topnav">
            <a className="active" href="#demo">Demo</a>
                <a href="#work">Previous work</a>
                <a href="#contact">Contact</a>
                <a href="#about">About SFCs</a>
            </div>
            <div id={'main'}>
                <div className={'charts'}>
                    <Chart name={'Original signals plot'} data={data} minValue={minChartValue} maxValue={maxChartValue}
                           type={'line'} xAxisName={'Time'}
                           yAxisName={'Signal'} yAxisLabelPos={'left'} legendLabels={displayedDataLabels}
                           startTimeXticks={startTimeXticks} finshTimeXticks={finshTimeXticks}
                           currentSignalXVal={signalMarkerPos} lineDataSmoothing={preset.lineDataSmoothing}
                           onLegendClick={selectDataColumns}/>
                    <Chart name={'Morton plot (with bars)'} data={data} minValue={minChartValue}
                           maxValue={maxChartValue}
                           type={'scatter'} xAxisName={'Morton'}
                           yAxisName={'Time steps'} yAxisLabelPos={'right'} currentSignalXVal={signalMarkerPos}/>
                </div>
                <div className={'play-controls'}>
                    <PlayButton onClick={onPlayClick} status={playStatus}/>
                    <Slider min={0} max={data?.length} onDrag={onSliderDrag} value={signalMarkerPos}/>

                    <div className={'input-controls'}>
                        <label>
                            Start Value:
                            <input type="number" value={startValue}
                                   onChange={(e) => setStartValue(Number(e.target.value))}/>
                        </label>
                        &nbsp;
                        <label>
                            End Value:
                            <input type="number" value={endValue}
                                   onChange={(e) => setEndValue(Number(e.target.value))}/>
                        </label>
                    </div>
                </div>
                <UploadButton onClick={uploadFile} label={'Upload file...'} currentFile={fileName.replace(/.\//, '')}/>
            </div>
            <div className="tabcontent">
            </div>
            <div className="footer">
                Demo of SFC encoding and barcode formation for automotive data.
            </div>

            <SelectColumnsDialog show={showDialog} setShow={setShowDialog} currentLabels={displayedDataLabels}
                                 dataLabelsRef={allDataLabelsRef} setDataLabels={setDataLabels}/>
        </>
    )
}

export default App
