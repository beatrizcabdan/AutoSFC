/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-unused-vars,no-unused-vars */
// noinspection JSUnusedLocalSymbols

import './App.scss'

import {ChangeEvent, FormEvent, useEffect, useRef, useState} from 'react';
import {Chart} from "./Chart.tsx";
import {PlaySlider} from "./PlaySlider.tsx";
import {PlayButton} from "./PlayButton.tsx";
import {SelectColumnsDialog} from "./SelectColumnsDialog.tsx";
import {UploadButton} from "./UploadButton.tsx";
import {debounce} from "./utils.ts";
import {DataRangeSlider} from "./DataRangeSlider.tsx";

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

    const [dataNumLines, setDataNumLines] = useState(-1)
    const [startLine, setStartLine] = useState(preset.dataRangeStart)
    const [endLine, setEndLine] = useState(preset.dataRangeEnd)

    const [displayedDataLabels, setDisplayedDataLabels] = useState<string[] | null>(['accel_trans', 'accel_lon'])

    const [data, setData] = useState<number[][]>([])
    const [startTimeXTicks, setStartTimeXTicks] = useState<number>()
    const [finishTimeXTicks, setFinishTimeXTicks] = useState<number>()
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
                let dataLabels: string[]
                if (!allDataLabelsRef.current || allDataLabelsRef.current.length === 0) {
                    dataLabels = lines[0]
                        .split(/;/)
                    formatDataLabels(dataLabels)
                    allDataLabelsRef.current = dataLabels
                } else {
                    dataLabels = allDataLabelsRef.current
                }
                const colIndices = displayedDataLabels?.map(label => dataLabels
                    .findIndex(col => col === label)
                ).filter(index => index !== -1) ?? [dataLabels.length - 2, dataLabels.length - 1]

                const beginTime = Number(lines[1]?.split(/;/)[0]) * 1000000 + Number(lines[1]?.split(/;/)[1]);
                let startTimeXTicks = Number(0 < startLine ? Number(lines[startLine + 1]?.split(/;/)[0]) * 1000000 + Number(lines[startLine + 1]?.split(/;/)[1]) : beginTime);
                let finishTimeXTicks = Number(-1 < endLine && (endLine < lines.length - 1) ? Number(lines[endLine + 1]?.split(/;/)[0]) * 1000000 + Number(lines[endLine + 1]?.split(/;/)[1]) : Number(lines[lines.length - 1]?.split(/;/)[0]) * 1000000 + Number(lines[lines.length - 1]?.split(/;/)[1]));
                startTimeXTicks = (startTimeXTicks - beginTime) / 1000000;
                finishTimeXTicks = (finishTimeXTicks - beginTime) / 1000000;

                const newData: number[][] = []
                let minData = Infinity
                let maxData = 0
                colIndices.forEach(index => {
                    const column: number[] = lines
                        .slice(1) // Skip headers
                        .slice(startLine >= 0 ? startLine : 0,
                            endLine >= 0 ? endLine : undefined)
                        .map(l => l.split(/;/))
                        .map(arr => Number(arr[index]))
                        .filter((_, i) => i % DATA_POINT_INTERVAL == 0)
                    newData.push(column)

                    const sortedData = [...column].sort((a, b) => a - b)
                    minData = Math.min(minData, sortedData[0])
                    maxData = Math.max(maxData, sortedData[sortedData.length - 1])
                })

                setData(newData)
                setStartTimeXTicks(startTimeXTicks)
                setFinishTimeXTicks(finishTimeXTicks)
                setMinChartValue(minData)
                setMaxChartValue(maxData)
                setDataNumLines(lines.length - 1)
            })
        })
    }

    onresize = debounce(loadFile, 200)

    useEffect(() => {
        loadFile()
    }, [startLine, endLine, displayedDataLabels, filePath]);

    const onSliderDrag = (e: Event, value: number | number[]) => {
        if (playStatus === PlayStatus.PLAYING) {
            clearInterval(playbackIntervalRef.current)
            setPlayStatus(PlayStatus.PAUSED)
        } else {
            setPlayStatus((value as number) >= 100 ? PlayStatus.REACHED_END : PlayStatus.PAUSED)
        }
        // @ts-ignore
        setSignalMarkerPos(value as number)
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

    // Only append to duplicates
    function formatDataLabels(dataLabels: string[]) {
        const dataLabelsSet = new Set<string>(dataLabels)
        dataLabelsSet.forEach(l1 => {
            const numInstances = dataLabels.filter(l2 => l1 === l2).length
            if (numInstances > 1) {
                let index = 1
                for (let i = 0; i < dataLabels.length; i++) {
                    if (dataLabels[i] === l1) {
                        dataLabels[i] = `${l1}_${index++}`
                    }
                }
            }
        })
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
                    formatDataLabels(dataLabels);
                    allDataLabelsRef.current = dataLabels

                    setDisplayedDataLabels(dataLabels.slice(dataLabels.length - 2))
                    setStartLine(0)
                    setEndLine(lines.length - 2) // -1 due to header row
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

    function onZoomSliderChange(_: Event, newValue: number[] | number) {
        setStartLine((newValue as number[])[0])
        setEndLine((newValue as number[])[1])
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
                           startTimeXticks={startTimeXTicks} finishTimeXticks={finishTimeXTicks}
                           currentSignalXVal={signalMarkerPos} lineDataSmoothing={preset.lineDataSmoothing}
                           onLegendClick={selectDataColumns}/>
                    <Chart name={'Morton plot (with bars)'} data={data} minValue={minChartValue}
                           maxValue={maxChartValue}
                           type={'scatter'} xAxisName={'Morton'}
                           yAxisName={'Time steps'} yAxisLabelPos={'right'} currentSignalXVal={signalMarkerPos}/>
                </div>
                <div className={'play-controls'}>
                    <PlayButton onClick={onPlayClick} status={playStatus}/>
                    <PlaySlider min={0} max={data?.length} onDrag={onSliderDrag} value={signalMarkerPos}/>

                    <DataRangeSlider dataRangeChartStart={startLine} dataRangeChartEnd={endLine}
                                     numLines={dataNumLines} onChange={(e, newValue) => onZoomSliderChange(e, newValue)}/>
                    <div className={'input-controls'}>
                        <label>
                            Start row:
                            <input type="number" value={startLine}
                                   onChange={(e) => setStartLine(Number(e.target.value))}/>
                        </label>
                        &nbsp;
                        <label>
                            End row:
                            <input type="number" value={endLine}
                                   onChange={(e) => setEndLine(Number(e.target.value))}/>
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
