import React, {ChangeEvent, useEffect, useRef, useState} from "react";
import {debounce, hilbertEncode, mortonInterlace} from "./utils.ts";
import {Preset, PresetComponent} from "./PresetComponent.tsx";
import {Chart} from "./Chart.tsx";
import {EncoderSwitch} from "./EncoderSwitch.tsx";
import {UploadButton} from "./UploadButton.tsx";
import {PlaySlider} from "./PlaySlider.tsx";
import {PlayButton} from "./PlayButton.tsx";
import {DataRangeSlider} from "./DataRangeSlider.tsx";
import {ProcessingComponent} from "./ProcessingComponent.tsx";
import {SelectColumnsDialog} from "./SelectColumnsDialog.tsx";
import {DEFAULT_BITS_PER_SIGNAL, DEFAULT_OFFSET, DEFAULT_SCALING_FACTOR, PlayStatus} from "./App.tsx";
import {demoPreset5} from "./Common.ts";
import './EncodingDemo.scss'
import App from './App.module.scss'
const { primaryColor } = App

const preset = demoPreset5

export function EncodingDemo() {
    const SLIDER_START_VAL = 100
    const EXAMPLE_FILE_PATH = './emergency_braking.csv'
    const LINE_COLORS = [primaryColor, 'orange', 'green', 'red', 'purple', 'brown']

    const [filePath, setFilePath] = useState(EXAMPLE_FILE_PATH)
    const [fileName, setFileName] = useState(EXAMPLE_FILE_PATH)
    const DATA_POINT_INTERVAL = preset.dataPointInterval

    const [dataNumLines, setDataNumLines] = useState(-1)
    const [startLine, setStartLine] = useState(preset.dataRangeStart)
    const [endLine, setEndLine] = useState(preset.dataRangeEnd)

    const [encoder, setEncoder] = useState('morton')

    const [minSFCvalue, setMinSFCvalue] = useState(preset.sfcRangeMin)
    const [maxSFCvalue, setMaxSFCvalue] = useState(preset.sfcRangeMax)
    const [initialMinSFCvalue, setInitialMinSFCvalue] = useState(preset.sfcRangeMin)
    const [initialMaxSFCvalue, setInitialMaxSFCvalue] = useState(preset.sfcRangeMax)

    const [displayedDataLabels, setDisplayedDataLabels] = useState<string[] | null>(['accel_x', 'accel_y']) // TODO: Revert to 'accel_x', 'accel_y', 'speed'

    const [data, setData] = useState<number[][]>([])
    const [transformedData, setTransformedData] = useState<number[][]>([]) // Transformed in "Transform" panel
    const [sfcData, setSfcData] = useState<number[]>([])

    // Use default scaling factor when scale is undefined (this to allow removing all digits in inputs)
    const [scales, setScales] = useState<(number | undefined)[]>([])
    const [offsets, setOffsets] = useState<(number | undefined)[]>([])
    const [bitsPerSignal, setBitsPerSignal] = useState<number | string>(DEFAULT_BITS_PER_SIGNAL)
    // Show transformed signals in signal chart
    const [showSignalTransforms, setShowSignalTransforms] = useState(false)

    const [startTimeXTicks, setStartTimeXTicks] = useState<number>()
    const [finishTimeXTicks, setFinishTimeXTicks] = useState<number>()
    const allDataLabelsRef = useRef<string[]>([])
    const [minChartValue, setMinChartValue] = useState<number>(-1)
    const [maxChartValue, setMaxChartValue] = useState<number>(-1)

    const [signalMarkerPos, setSignalMarkerPos] = useState<number>(SLIDER_START_VAL)
    const [playStatus, setPlayStatus] = useState(PlayStatus.PAUSED)
    const playbackIntervalRef = useRef(-1)

    const [showDialog, setShowDialog] = useState(false)

    const [currentPresetName, setCurrentPresetName] = useState('')

    const loadFile = () => {
        fetch(filePath).then(r => {
            r.text().then(t => {
                const lines = t
                    .trim()
                    .split(/[;,]?\n/)
                let dataLabels: string[]
                if (!allDataLabelsRef.current || allDataLabelsRef.current.length === 0) {
                    dataLabels = lines[0]
                        .split(/[;,]/)
                    formatDataLabels(dataLabels)
                    allDataLabelsRef.current = dataLabels
                } else {
                    dataLabels = allDataLabelsRef.current
                }
                const colIndices = displayedDataLabels?.map(label => dataLabels
                    .findIndex(col => col === label)
                ).filter(index => index !== -1).sort() ?? [dataLabels.length - 2, dataLabels.length - 1]

                const beginTime = Number(lines[1]?.split(/[;,]/)[0]) * 1000000 + Number(lines[1]?.split(/[;,]/)[1]);
                let startTimeXTicks = Number(0 < startLine ? Number(lines[startLine + 1]?.split(/[;,]/)[0]) * 1000000 + Number(lines[startLine + 1]?.split(/[;,]/)[1]) : beginTime);
                let finishTimeXTicks = Number(-1 < endLine && (endLine < lines.length - 1) ? Number(lines[endLine + 1]?.split(/[;,]/)[0]) * 1000000 + Number(lines[endLine + 1]?.split(/[;,]/)[1]) : Number(lines[lines.length - 1]?.split(/[;,]/)[0]) * 1000000 + Number(lines[lines.length - 1]?.split(/[;,]/)[1]));
                startTimeXTicks = (startTimeXTicks - beginTime) / 1000000;
                finishTimeXTicks = (finishTimeXTicks - beginTime) / 1000000;

                const newData: number[][] = []
                const newTransformedData: number[][] = []
                let minData = Infinity
                let maxData = 0
                colIndices.forEach((colIndex, i) => {
                    const column: number[] = lines
                        .slice(1) // Skip headers
                        .slice(startLine >= 0 ? startLine : 0, endLine >= 0 ? endLine : undefined)
                        .map(l => l.split(/[;,]/))
                        .map(arr => Number(arr[colIndex]))
                        .filter((_, i) => i % DATA_POINT_INTERVAL == 0)
                    newData.push(column)
                    const transformedColumn =
                        column.map((val) => val * (scales[i] ?? DEFAULT_SCALING_FACTOR)
                            + (offsets[i] ?? DEFAULT_OFFSET))
                    newTransformedData.push(transformedColumn)

                    const sortedData = (showSignalTransforms ? [...transformedColumn] : [...column])
                        .sort((a, b) => a - b)

                    minData = Math.min(minData, sortedData[0])
                    maxData = Math.max(maxData, sortedData[sortedData.length - 1])
                })

                computeSetSFCData(newTransformedData, bitsPerSignal, encoder, true, true);

                setData(newData)
                setTransformedData(newTransformedData)
                if (scales.length === 0) {
                    setScales(Array(colIndices.length).fill(DEFAULT_SCALING_FACTOR))
                }
                if (offsets.length === 0) {
                    setOffsets(Array(colIndices.length).fill(DEFAULT_OFFSET))
                }
                setStartTimeXTicks(startTimeXTicks)
                setFinishTimeXTicks(finishTimeXTicks)
                setMinChartValue(minData)
                setMaxChartValue(maxData)
                setDataNumLines(lines.length - 1)
            })
        })
    }

    onresize = debounce(loadFile)

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
        for (let i = 0; i < dataLabels.length; i++) {
            dataLabels[i] = dataLabels[i].replace('\r', '')
        }
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
                        .split(/[,;]?\n/)
                    const dataLabels = lines[0]
                        .split(/[,;]/)
                    formatDataLabels(dataLabels);
                    allDataLabelsRef.current = dataLabels

                    setDisplayedDataLabels(dataLabels.slice(dataLabels.length - 2))
                    setStartLine(0)
                    setEndLine(lines.length - 2) // -1 due to header row
                    const url = URL.createObjectURL(file)
                    setFileName(file.name)
                    setFilePath(url)
                    setCurrentPresetName('')
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

    const onZoomSliderChange = (_: Event, newValue: number[] | number) => {
        setStartLine((newValue as number[])[0])
        setEndLine((newValue as number[])[1])
    };

    const presetSelected = (preset: Preset | null) => {
        if (!preset) {
            setCurrentPresetName('')
            return
        }
        for (const s of preset.signalTransforms) {
            if (allDataLabelsRef.current.length > 0 && !allDataLabelsRef.current.includes(s.signalName)) {
                console.error(`No such signal name: ${s.signalName}!`)
                alert(`No such signal name: ${s.signalName}!`)
                return
            }
        }

        setCurrentPresetName(preset.name)
        setBitsPerSignal(preset.bitsPerSignal)
        setStartLine(preset.signalStartRow)
        setEndLine(preset.signalEndRow)
        setShowSignalTransforms(preset.plotTransformedSignals)
        setMaxSFCvalue(preset.cspEndRow)
        setMinSFCvalue(preset.cspStartRow)
        setEncoder(preset.encoder)
        // Assume order is the same in signalTransforms, scales & offsets
        setOffsets(preset.signalTransforms.map(s => s.offset))
        setScales(preset.signalTransforms.map(s => s.scaling))
        setDisplayedDataLabels(preset.signalTransforms.map(s => s.signalName))
    }

    const setMinMaxChartValues = (data: number[][]) => {
        let min = Infinity
        let max = -Infinity
        data.forEach(col => col
            .forEach(val => {
                min = Math.min(min, val)
                max = Math.max(max, val)
            }))
        setMinChartValue(min)
        setMaxChartValue(max)
    }

    const onScalesChanged = (index: number, scale: number | undefined) => {
        scales[index] = scale
        setScales([...scales])
        transformedData[index] = data[index].map(val => val * (scale ?? DEFAULT_SCALING_FACTOR) + (offsets[index] ?? 0))
        setTransformedData(transformedData)
        setMinMaxChartValues(showSignalTransforms ? transformedData : data)
        computeSetSFCData(transformedData, bitsPerSignal, undefined, true)
    };

    const onOffsetsChanged = (index: number, offset: number | undefined) => {
        offsets[index] = offset
        setOffsets([...offsets])
        transformedData[index] = data[index].map(val => val * (scales[index] ?? DEFAULT_SCALING_FACTOR) + (offset ?? 0))
        setTransformedData(transformedData)
        setMinMaxChartValues(showSignalTransforms ? transformedData : data)
        computeSetSFCData(transformedData, bitsPerSignal, undefined, true)
    };

    const onBitsPerSignalChanged = (bits: number | string) => {
        setBitsPerSignal(bits)
        computeSetSFCData(transformedData, bits, undefined, true)
    };

    function onShowSignalTransformsChanged(show: boolean) {
        setMinMaxChartValues(show ? transformedData : data)
        setShowSignalTransforms(show)
    }

    const computeSetSFCData = (transformedData: number[][], bitsPerSignal: number | string,
                               newEncoder?: string, setMinMaxValues?: boolean, initialMinMaxValues?: boolean) => {
        const truncatedData = transformedData.map(column => column.map(value =>
            Math.trunc(value))) // Add truncating processing
        const currentEncoder = newEncoder ?? encoder
        const sfcData = currentEncoder === 'morton' ? mortonInterlace(truncatedData, Number(typeof bitsPerSignal == 'string' ? DEFAULT_BITS_PER_SIGNAL : bitsPerSignal)).reverse()
            : hilbertEncode(truncatedData, Number(typeof bitsPerSignal == 'string' ? DEFAULT_BITS_PER_SIGNAL : bitsPerSignal)).reverse()
        if (setMinMaxValues) {
            const sfcSorted = [...sfcData!].sort((a, b) => a - b)
            setMinSFCvalue(sfcSorted[0])
            setMaxSFCvalue(sfcSorted[sfcSorted.length - 1])

            if (initialMinMaxValues) {
                setInitialMinSFCvalue(sfcSorted[0])
                setInitialMaxSFCvalue(sfcSorted[sfcSorted.length - 1])
            }
        }
        setSfcData(sfcData)
    }

    const onEncoderSwitch = () => {
        if (encoder === 'morton' && Number(bitsPerSignal) * data.length > 64) {
            alert("It is not possible to encode the signals with Hilbert with so many bits. Please reduce the number of bits per signal. Num signals * num bits <= 64!")
            return
        }
        const newEncoder = encoder === 'morton' ? 'hilbert' : 'morton'
        computeSetSFCData(transformedData, bitsPerSignal, newEncoder, true)
        setEncoder(newEncoder)
    };
    return <div id={'encoding-demo-div'}>
        <h1>Encoding demo</h1>
        <div className={"charts"}>
            <Chart name={"Original signals plot"} data={showSignalTransforms ? transformedData : data}
                   scales={scales} offsets={offsets}
                   minValue={minChartValue} maxValue={maxChartValue} type={"line"} xAxisName={"Time"}
                   yAxisName={"Signal"} yAxisLabelPos={"left"} legendLabels={displayedDataLabels}
                   startTimeXticks={startTimeXTicks} finishTimeXticks={finishTimeXTicks}
                   currentSignalXVal={signalMarkerPos} lineDataSmoothing={preset.lineDataSmoothing}
                   onLegendClick={selectDataColumns} lineColors={LINE_COLORS}
                   transformedData={transformedData}/>
            <Chart name={"Encoded signals plot (CSP)"} data={data} transformedData={transformedData}
                   scales={scales}
                   offsets={offsets} minValue={minChartValue} maxValue={maxChartValue} type={"scatter"}
                   xAxisName={"SFC Value"} bitsPerSignal={bitsPerSignal}
                   yAxisName={"Time steps"} yAxisLabelPos={"right"} currentSignalXVal={signalMarkerPos}
                   sfcData={sfcData} minSfcRange={[minSFCvalue]} maxSfcRange={[maxSFCvalue]}/>
        </div>
        <div className={"controls"}>
            <div className={"vert-control-wrapper"}>
                <div className={"control-container"} id={"first-control-row"}>
                    <div className={"file-container"}>
                        <h3>Current file</h3>
                        <UploadButton onClick={uploadFile} label={"Upload file..."}
                                      currentFile={fileName.replace(/.\//, "")}/>
                    </div>
                    <div className={"position-container"}>
                        <h3>Current datapoint</h3>
                        <PlaySlider min={0} max={data?.length} onDrag={onSliderDrag}
                                    value={signalMarkerPos}/>
                        <PlayButton onClick={onPlayClick} status={playStatus}/>
                    </div>
                </div>
                <div className={"control-row"}>
                    <div className={"control-container"} id={"range-container"}>
                        <h3>Displayed range</h3>
                        <DataRangeSlider dataRangeChartStart={startLine}
                                         dataRangeChartEnd={endLine}
                                         numLines={dataNumLines}
                                         onChange={(e, newValue) => onZoomSliderChange(e, newValue)}/>
                        <div className={"text-controls"}>
                            <label className={"input-label"}>
                                Start row
                                <input type="number" value={startLine}
                                       onChange={(e) => setStartLine(Number(e.target.value))}/>
                            </label>
                            <label className={"input-label"}>
                                End row
                                <input type="number" value={endLine}
                                       onChange={(e) => setEndLine(Number(e.target.value))}/>
                            </label>
                        </div>
                    </div>
                    <div className={"control-container"} id={"presets-container"}>
                        <h3>Presets</h3>
                        <PresetComponent initialDataPath={EXAMPLE_FILE_PATH} onPresetSelect={presetSelected}
                                         plotTransformedSignals={showSignalTransforms} scales={scales}
                                         offsets={offsets}
                                         displayedStartRow={startLine}
                                         displayedEndRow={endLine} bitsPerSignal={bitsPerSignal}
                                         minSfcValue={minSFCvalue} maxSfcValue={maxSFCvalue}
                                         encoder={encoder}
                                         displayedDataLabels={displayedDataLabels}
                                         currentPresetName={currentPresetName}
                                         currentDataFile={fileName.replace(/.\//, "")}/>
                    </div>
                </div>
            </div>
            <div className={"vert-control-wrapper"}>
                <div className={"vert-control-wrapper"}>
                    <ProcessingComponent variant={'full'} displayedDataLabels={displayedDataLabels} lineColors={LINE_COLORS}
                                         scales={scales} offsets={offsets}
                                         bitsPerSignal={bitsPerSignal} onScalesChanged={onScalesChanged}
                                         showSignalTransforms={showSignalTransforms}
                                         setShowSignalTransforms={onShowSignalTransformsChanged}
                                         onOffsetsChanged={onOffsetsChanged} minSfcValue={minSFCvalue}
                                         setMinSfcValue={setMinSFCvalue} setMaxSfcValue={setMaxSFCvalue}
                                         maxSfcValue={maxSFCvalue}
                                         initialMinSfcValue={initialMinSFCvalue}
                                         initialMaxSfcValue={initialMaxSFCvalue}
                                         onBitsPerSignalChanged={onBitsPerSignalChanged}
                                         encoderSwitch={<EncoderSwitch encoder={encoder} onSwitch={onEncoderSwitch} size={'small'}
                                                                className={'encoder-label'}/>}
                    />
                </div>
            </div>
        </div>

        <SelectColumnsDialog show={showDialog} setShow={setShowDialog} currentLabels={displayedDataLabels} demoName={'encoding'}
                             allDataLabels={allDataLabelsRef.current ?? []} setDataLabels={setDataLabels}/>
    </div>;
}