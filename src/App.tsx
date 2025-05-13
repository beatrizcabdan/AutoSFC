/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-unused-vars,no-unused-vars */
// noinspection JSUnusedLocalSymbols

import './App.scss'

import React, {ChangeEvent, useEffect, useRef, useState} from 'react';
import {Chart} from "./Chart.tsx";
import {PlaySlider} from "./PlaySlider.tsx";
import {PlayButton} from "./PlayButton.tsx";
import {SelectColumnsDialog} from "./SelectColumnsDialog.tsx";
import {UploadButton} from "./UploadButton.tsx";
import {debounce, mortonInterlace, hilbertEncode} from "./utils.ts";
import {DataRangeSlider} from "./DataRangeSlider.tsx";
import {PresetComponent} from "./PresetComponent.tsx";
import {ProcessingComponent} from "./ProcessingComponent.tsx";
import {EncoderSwitch} from "./EncoderSwitch.tsx";
import {PaperContainer} from "./PaperContainer.tsx";

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

const demoPreset5 = {
    dataPointInterval: 1,
    dataRangeStart: 0,
    dataRangeEnd: 236,
    lineDataSmoothing: 0,
    sfcRangeMin: 0,
    sfcRangeMax: 1000000000
}

const preset = demoPreset5

// eslint-disable-next-line react-refresh/only-export-components
export enum PlayStatus {
    PLAYING, PAUSED, REACHED_END
}

export const DEFAULT_SCALING_FACTOR = 10
export const DEFAULT_OFFSET = 100
export const DEFAULT_BITS_PER_SIGNAL = 14

function App() {
    const SLIDER_START_VAL = 100
    const EXAMPLE_FILE_PATH = './emergency_braking.csv'
    const LINE_COLORS = ['blue', 'orange', 'green', 'red', 'purple', 'brown']

    const [filePath, setFilePath] = useState(EXAMPLE_FILE_PATH)
    const [fileName, setFileName] = useState(EXAMPLE_FILE_PATH)
    const DATA_POINT_INTERVAL  = preset.dataPointInterval

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
                ).filter(index => index !== -1).sort() ?? [dataLabels.length - 2, dataLabels.length - 1]

                const beginTime = Number(lines[1]?.split(/;/)[0]) * 1000000 + Number(lines[1]?.split(/;/)[1]);
                let startTimeXTicks = Number(0 < startLine ? Number(lines[startLine + 1]?.split(/;/)[0]) * 1000000 + Number(lines[startLine + 1]?.split(/;/)[1]) : beginTime);
                let finishTimeXTicks = Number(-1 < endLine && (endLine < lines.length - 1) ? Number(lines[endLine + 1]?.split(/;/)[0]) * 1000000 + Number(lines[endLine + 1]?.split(/;/)[1]) : Number(lines[lines.length - 1]?.split(/;/)[0]) * 1000000 + Number(lines[lines.length - 1]?.split(/;/)[1]));
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
                        .map(l => l.split(/;/))
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

    const onZoomSliderChange = (_: Event, newValue: number[] | number) => {
        setStartLine((newValue as number[])[0])
        setEndLine((newValue as number[])[1])
    };

    const onSFCZoomSliderChange = (_: Event, newValue: number[] | number) => {
        setMinSFCvalue((newValue as number[])[0])
        setMaxSFCvalue((newValue as number[])[1])
    };

    const presetSelected = (startRow: number, endRow: number) => {
        setStartLine(startRow)
        setEndLine(endRow)
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
                               newEncoder?:string, setMinMaxValues?: boolean, initialMinMaxValues?: boolean) => {
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

    // @ts-ignore
    const onEncoderSwitch = () => {
        if (encoder === 'morton' && Number(bitsPerSignal) * data.length > 64) {
            alert("It is not possible to encode the signals with Hilbert with so many bits. Please reduce the number of bits per signal. Num signals * num bits <= 64!")
            return
        }
        const newEncoder = encoder === 'morton' ? 'hilbert' : 'morton'
        computeSetSFCData(transformedData, bitsPerSignal, newEncoder, true)
        setEncoder(newEncoder)
    };

    return (
        <>
            <div className="landing-section">
                <img src="./logo2.png" alt="AutoSFC logo" className="header-img"/>
                <p>AutoSFC is a web-based demo for the research-activities around the usage of Space-Filling Curves
                    (SFC) for encoding and reducing the dimensionality of automotive data.</p>
            </div>

            <div className="topnav">
                <a className="active" href="#main">Demo</a>
                <a href="#work">Previous work</a>
                <a href="#about">About SFCs</a>
                <a href="#contact">Contact</a>
            </div>

            <div id={'main'}>
                <h1>AutoSFC tool demo</h1>

                <div className={'charts'}>
                    <Chart name={'Original signals plot'} data={showSignalTransforms ? transformedData : data} scales={scales} offsets={offsets}
                           minValue={minChartValue} maxValue={maxChartValue} type={'line'} xAxisName={'Time'}
                           yAxisName={'Signal'} yAxisLabelPos={'left'} legendLabels={displayedDataLabels}
                           startTimeXticks={startTimeXTicks} finishTimeXticks={finishTimeXTicks}
                           currentSignalXVal={signalMarkerPos} lineDataSmoothing={preset.lineDataSmoothing}
                           onLegendClick={selectDataColumns} lineColors={LINE_COLORS} transformedData={transformedData} />
                    <Chart name={'Encoded signals plot (CSP)'} data={data} transformedData={transformedData} scales={scales}
                           offsets={offsets} minValue={minChartValue} maxValue={maxChartValue} type={'scatter'} xAxisName={'Morton'} bitsPerSignal={bitsPerSignal}
                           yAxisName={'Time steps'} yAxisLabelPos={'right'} currentSignalXVal={signalMarkerPos}
                           sfcData={sfcData} minSFCrange={minSFCvalue} maxSFCrange={maxSFCvalue}
                           encoderSwitch={<EncoderSwitch encoder={encoder} onSwitch={onEncoderSwitch}/>}/>
                </div>
                <div className={'controls'}>
                    <div className={'vert-control-wrapper'}>
                        <div className={'control-container'} id={'first-control-row'}>
                            <div className={'file-container'}>
                                <h3>Current file</h3>
                                <UploadButton onClick={uploadFile} label={'Upload file...'}
                                              currentFile={fileName.replace(/.\//, '')}/>
                            </div>
                            <div className={'position-container'}>
                                <h3>Current datapoint</h3>
                                <PlaySlider min={0} max={data?.length} onDrag={onSliderDrag} value={signalMarkerPos}/>
                                <PlayButton onClick={onPlayClick} status={playStatus}/>
                            </div>
                        </div>
                        <div className={'control-row'}>
                            <div className={'control-container'} id={'range-container'}>
                                <h3>Displayed range</h3>
                                <DataRangeSlider dataRangeChartStart={startLine} dataRangeChartEnd={endLine}
                                                 numLines={dataNumLines}
                                                 onChange={(e, newValue) => onZoomSliderChange(e, newValue)}/>
                                <div className={'text-controls'}>
                                    <label className={'input-label'}>
                                        Start row:
                                        <input type="number" value={startLine}
                                               onChange={(e) => setStartLine(Number(e.target.value))}/>
                                    </label>
                                    <label className={'input-label'}>
                                        End row:
                                        <input type="number" value={endLine}
                                               onChange={(e) => setEndLine(Number(e.target.value))}/>
                                    </label>
                                </div>
                            </div>
                            <div className={'control-container'} id={'presets-container'}>
                                <h3>Presets</h3>
                                <PresetComponent initialDataPath={EXAMPLE_FILE_PATH} onPresetSelect={presetSelected}
                                                 displayedStartRow={startLine} displayedEndRow={endLine}
                                                 currentDataFile={fileName.replace(/.\//, '')}/>
                            </div>
                        </div>
                    </div>
                    <div className={'vert-control-wrapper'}>
                        <div className={'vert-control-wrapper'}>
                            <ProcessingComponent displayedDataLabels={displayedDataLabels} lineColors={LINE_COLORS}
                                                 scales={scales} offsets={offsets}
                                                 bitsPerSignal={bitsPerSignal} onScalesChanged={onScalesChanged}
                                                 showSignalTransforms={showSignalTransforms}
                                                 setShowSignalTransforms={onShowSignalTransformsChanged}
                                                 onOffsetsChanged={onOffsetsChanged} minSFCvalue={minSFCvalue}
                                                 setMinSFCvalue={setMinSFCvalue} setMaxSFCvalue={setMaxSFCvalue} maxSFCvalue={maxSFCvalue}
                                                 initialMinSFCvalue={initialMinSFCvalue} initialMaxSFCvalue={initialMaxSFCvalue}
                                                 onBitsPerSignalChanged={onBitsPerSignalChanged}/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="tabcontent" id={'work'}>
            <h1>Previous work using Space-Filling Curves (SFCs)</h1>

                <div className="papers-container">
                    <PaperContainer title={"Systematic Evaluation of Applying Space-Filling Curves to Automotive Maneuver Detection"} description={"In this paper, we are presenting a maneuver detection approach based on two variants of space-filling curves (Z-order and Hilbert) to detect maneuvers when passing roundabouts that do not use GPS data. We systematically evaluate their respective performance by including permutations of selections of kinematic signals at varying frequencies."} url={"https://ieeexplore.ieee.org/abstract/document/10422366/"}/>
                    <PaperContainer title={"Comparing Optical Flow and Deep Learning to Enable Computationally Efficient Traffic Event Detection with Space-Filling Curves"} description={"We compare Optical Flow (OF) and Deep Learning (DL) to feed computationally efficient event detection via space-filling curves on video data from a forward-facing, in-vehicle camera. Our first approach leverages unexpected disturbances in the OF field from vehicle surroundings; the second approach is a DL model trained on human visual attention to predict a driver's gaze to spot potential event locations. We feed these results to a space-filling curve to reduce dimensionality and achieve computationally efficient event retrieval."} url={"https://ieeexplore.ieee.org/abstract/document/10919665"}/>
                    <PaperContainer title={"ZEBRA: Z-order Curve-based Event Retrieval Approach to Efficiently Explore Automotive Data"} description={"In this paper, we leverage Z-order space-filling curves to systematically reduce data dimensionality while preserving domain-specific data properties, which allows us to explore even large-scale field data sets to spot interesting events orders of magnitude faster than processing time-series data directly."} url={"https://ieeexplore.ieee.org/abstract/document/10186770"}/>
                    <PaperContainer title={"Comparing the Locality Preservation of Z-order Curves and Hilbert Curves"} description={"We found that asymmetry in data can have a strong deleterious or advantageous effect on event querying, and surprisingly little difference in the True Positive to False Positive ratio of search results between Morton and Hilbert curves. Overall, we prove the viability of this use of both Morton and Hilbert curves for up to eight dimensions of data."} url={"https://gupea.ub.gu.se/handle/2077/77963"}/>
                    <PaperContainer title={"Extracting Driving Styles from Automotive Sensor Data to Develop Personas"} description={"Our approach is innovative in its use of dynamic, real-world driving data as opposed to static or direct user interaction data commonly employed in persona development. This allows for a deeper understanding of driver behaviors, which are indirectly inferred from sensor data, thus providing a foundation for creating detailed personas."} url={"https://ieeexplore.ieee.org/document/10773569"}/>
                </div>
            </div>
            <div className="tabcontent" id={'about'}>
                <h1>Space-Filling Curves (SFCs): what and why?</h1>
                <div className="papers-container">
                    <PaperContainer title={"Space-Filling Curves"} description={"The present book provides an introduction to using space-filling curves (SFC) as tools in scientific computing. Special focus is laid on the representation of SFC and on resulting algorithms."} url={"https://link.springer.com/book/10.1007/978-3-642-31046-1"}/>
                    <PaperContainer title={"SFCGen: A framework for efficient generation of multi-dimensional space-filling curves by recursion"} description={"We describe a movement specification table, a universal turtle algorithm to enumerate points along a space-filling curve, a table-based indexing algorithm to transform coordinates of a point into its position along the curve and an algorithm to pregenerate the table automatically."} url={"https://dl.acm.org/doi/abs/10.1145/1055531.1055537"}/>
                    <PaperContainer title={"Using Space-Filling Curves for Multi-dimensional Indexing"} description={"This paper presents and discusses a radically different approach to multi-dimensional indexing based on the concept of the space-filling curve."} url={"https://link.springer.com/chapter/10.1007/3-540-45033-5_3"}/>
                    <PaperContainer title={"Encoding and Decoding Algorithms for Arbitrary Dimensional Hilbert Order"} description={"Hilbert order is widely applied in many areas. However, most of the algorithms are confined to low dimensional cases. In this paper, algorithms for encoding and decoding arbitrary dimensional Hilbert order are presented."} url={"https://arxiv.org/abs/1601.01274"}/>
                </div>
            </div>

            <div className="tabcontent" id={'contact'}>
                <h1>Want to collaborate? Contact us!</h1>

                <p>This website is under construction. If you want to know more about Space-Filling Curves (SFCs), or
                    driving event detection using them, feel free to send us an email to Beatriz Cabrero-Daniel at <a
                        href="mailto:beatriz.cabrero-daniel@gu.se">beatriz.cabrero-daniel@gu.se</a> for more info.</p>
                <br/>
                <br/>
                <br/>
            </div>

            <div className="footer">
                Demo of SFC encoding for automotive data. Site under construction. Contact Beatriz Cabrero-Daniel at <a
                href="mailto:beatriz.cabrero-daniel@gu.se">beatriz.cabrero-daniel@gu.se</a> for more info.
            </div>

            <SelectColumnsDialog show={showDialog} setShow={setShowDialog} currentLabels={displayedDataLabels}
                                 dataLabelsRef={allDataLabelsRef} setDataLabels={setDataLabels}/>
        </>
    )
}

export default App
