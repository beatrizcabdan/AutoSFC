import React, {ChangeEvent, useEffect, useRef, useState} from "react";
import {DEFAULT_BITS_PER_SIGNAL, DEFAULT_OFFSET, DEFAULT_SCALING_FACTOR} from "./App.tsx";
import {debounce, hilbertEncode, mortonInterlace} from "./utils.ts";
import {Chart} from "./Chart.tsx";
import {EncoderSwitch} from "./EncoderSwitch.tsx";
import {UploadButton} from "./UploadButton.tsx";
import {DataRangeSlider} from "./DataRangeSlider.tsx";
import {ProcessingComponent} from "./ProcessingComponent.tsx";
import {SelectColumnsDialog} from "./SelectColumnsDialog.tsx";
import {demoPreset5} from "./Common.ts";
import './CspComparisonDemo.scss'
import {Checkbox, FormControlLabel, IconButton} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import App from './App.module.scss'
const { primaryColor } = App

const preset = demoPreset5

// TODO: Choose labels, deleting/hiding files, more compact layout, presets... (later)
// Good demo values:
// accel_x: 4000 / 729
// accel_y: 5000 / 729
// sampleTimeStamp.microseconds: 5000 / 10
// groundSpeed: 5005 / 10

export function CspComparisonDemo() {
    const EXAMPLE_FILE_PATHS = ['./emergency_braking.csv', './example-data.csv']
    const LINE_COLORS = [primaryColor, 'green', 'red', 'purple', 'brown', 'orange']

    const [filePaths, setFilePaths] = useState(EXAMPLE_FILE_PATHS)
    const [fileNames, setFileNames] = useState(EXAMPLE_FILE_PATHS)
    const DATA_POINT_INTERVAL = preset.dataPointInterval

    const [dataNumLines, setDataNumLines] = useState<number[]>([236, 473])
    const [startLines, setStartLines] = useState<number[]>([0, 0])
    const [endLines, setEndLines] = useState<number[]>([236, 473])

    const [encoder, setEncoder] = useState('morton')

    const [minSfcValues, setMinSfcValues] = useState<number[]>([])
    const [maxSfcValues, setMaxSfcValues] = useState<number[]>([])
    const [initialMinSfcValues, setInitialMinSfcValues] = useState<number[]>([])
    const [initialMaxSfcValues, setInitialMaxSfcValues] = useState<number[]>([])

    const [displayedDataLabels, setDisplayedDataLabels] = useState<string[][] | null>([
        ['accel_x', 'accel_y'],
        ['sampleTimeStamp.microseconds', 'groundSpeed']
    ])

    const [data, setData] = useState<number[][][]>([])
    const [transformedData, setTransformedData] = useState<number[][][]>([]) // Transformed in "Transform" panel
    const [sfcData, setSfcData] = useState<number[][]>([])

    // Use default scaling factor when scale is undefined (this to allow removing all digits in inputs)
    const [scales, setScales] = useState<(number | undefined)[][]>([])
    const [offsets, setOffsets] = useState<(number | undefined)[][]>([])
    const [bitsPerSignal, setBitsPerSignal] = useState<number | string>(DEFAULT_BITS_PER_SIGNAL)

    const allDataLabelsRef = useRef<string[][]>([])

    const [minChartValue, setMinChartValue] = useState<number>(-1)
    const [maxChartValue, setMaxChartValue] = useState<number>(-1)

    const [showDialog, setShowDialog] = useState(false)
    const [fileToSelectColumnsFor, setFileToSelectColumnsFor] = useState(-1)

    const loadFiles = async () => {
        const newData: number[][][] = []
        const newTransformedData: number[][][] = []
        const numLines: number[] = []
        const numLabels: number[] = []

        let minData = Number.MAX_VALUE
        let maxData = Number.MIN_VALUE

        for (const filePath of filePaths) {
            const i = filePaths.indexOf(filePath);
            await fetch(filePath).then(async r => {
                await r.text().then(t => {
                    const lines = t
                        .trim()
                        .split(/[;,]?\n/)
                    let dataLabels: string[]
                    if (!allDataLabelsRef.current || !allDataLabelsRef.current[i] || allDataLabelsRef.current[i].length === 0) {
                        dataLabels = lines[0]
                            .split(/[;,]/)
                        formatDataLabels(dataLabels)
                        allDataLabelsRef.current[i] = dataLabels
                    } else {
                        dataLabels = allDataLabelsRef.current[i]
                    }
                    const colIndices: number[] = displayedDataLabels![i].map(label => dataLabels
                        .findIndex(col => col === label)).filter(index => index !== -1).sort() ?? [dataLabels.length - 2, dataLabels.length - 1];

                    const newFileData: number[][] = []
                    const newFileTransformedData: number[][] = []

                    colIndices.forEach((colIndex, j) => {
                        const column: number[] = lines
                            .slice(1) // Skip headers
                            .slice(startLines[i] !== undefined && startLines[i] >= 0 ? startLines[i] : 0,
                                endLines[i] !== undefined && endLines[i] >= 0 ? endLines[i] : undefined)
                            .map(l => l.split(/[;,]/))
                            .map(arr => Number(arr[colIndex]))
                            .filter((_, k) => k % DATA_POINT_INTERVAL == 0)
                        newFileData.push(column)
                        const transformedColumn =
                            column.map((val) => val * ((scales[i] && scales && scales[i][j]) ?? DEFAULT_SCALING_FACTOR)
                                + ((offsets[i] && offsets[i][j]) ?? DEFAULT_OFFSET))
                        newFileTransformedData.push(transformedColumn)

                        const sortedData = ([...column])
                            .sort((a, b) => a - b)

                        minData = Math.min(minData, sortedData[0])
                        maxData = Math.max(maxData, sortedData[sortedData.length - 1])
                    })

                    numLabels.push(colIndices.length)
                    newData.push(newFileData)
                    newTransformedData.push(newFileTransformedData)
                    numLines.push(lines.length - 1)

                    // Only render after last iteration
                    if (numLabels.length === filePaths.length) {
                        computeSetSfcData(newTransformedData, bitsPerSignal, encoder, true, true);
                        setData(newData)
                        setTransformedData(newTransformedData)
                        if (scales.length === 0) {
                            setScales(Array.from(Array(numLabels.length).keys())
                                .map((_, i) => Array(numLabels[i]).fill(DEFAULT_SCALING_FACTOR)))
                        }
                        if (offsets.length === 0) {
                            setOffsets(Array.from(Array(numLabels.length).keys())
                                .map((_, i) => Array(numLabels[i]).fill(DEFAULT_OFFSET)))
                        }
                        setDataNumLines(numLines)
                        setMinChartValue(minData)
                        setMaxChartValue(maxData)
                    }
                })
            })
        }

    }

    onresize = debounce(loadFiles)

    useEffect(() => {
        loadFiles()
    }, [startLines, endLines, displayedDataLabels, filePaths]);

    const selectDataColumns = () => {
        if (!showDialog) {
            setShowDialog(true)
        }
    };

    const setDataLabels = (labels: string[][]) => {
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

    function uploadFile(e: ChangeEvent<HTMLInputElement>, fileIndex: number) {
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
                    allDataLabelsRef.current[fileIndex] = dataLabels

                    setDisplayedDataLabels([
                        ...allDataLabelsRef.current.slice(0, fileIndex),
                        dataLabels.slice(dataLabels.length - 2),
                        ...allDataLabelsRef.current.slice(fileIndex + 1)
                    ])
                    startLines[fileIndex] = 0
                    setStartLines([...startLines])
                    endLines[fileIndex] = lines.length - 2 // -1 due to header row
                    setEndLines([...endLines])
                    const url = URL.createObjectURL(file)
                    setFileNames([...fileNames.slice(0, fileIndex), file.name, ...fileNames.slice(fileIndex + 1)])
                    setFilePaths([...filePaths.slice(0, fileIndex), url, ...filePaths.slice(fileIndex + 1)])
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

    const onZoomSliderChange = (_: Event, newValue: number[] | number, fileIndex: number) => {
        const newStartLines = startLines
        newStartLines[fileIndex] = (newValue as number[])[0]
        setStartLines([...newStartLines])
        const newEndLines = endLines
        newEndLines[fileIndex] = (newValue as number[])[1]
        setEndLines(newEndLines)
    };

    const setMinMaxChartValues = (data: number[][][]) => {
        let min = Number.MAX_VALUE
        let max = Number.MIN_VALUE

        data.forEach(fileData => {
            fileData.forEach(col => col
                .forEach(val => {
                    min = Math.min(min, val)
                    max = Math.max(max, val)
                }))
        })

        setMinChartValue(min)
        setMaxChartValue(max)
    }

    const onScalesChanged = (labelIndex: number, scale: number | undefined, fileIndex: number) => {
        scales[fileIndex][labelIndex] = scale
        setScales([...scales.slice(0, fileIndex), [...scales[fileIndex]], ...scales.slice(fileIndex + 1)])
        transformedData[fileIndex][labelIndex] = data[fileIndex][labelIndex].map(val => val * (scale ?? DEFAULT_SCALING_FACTOR) + (offsets[fileIndex][labelIndex] ?? 0))
        setTransformedData([...transformedData.slice(0, fileIndex), [...transformedData[fileIndex]], ...transformedData.slice(fileIndex + 1)])
        setMinMaxChartValues(data)
        computeSetSfcData(transformedData, bitsPerSignal, undefined, true)
    };

    const onOffsetsChanged = (labelIndex: number, offset: number | undefined, fileIndex: number) => {
        offsets[fileIndex][labelIndex] = offset
        setOffsets([...offsets.slice(0, fileIndex), [...offsets[fileIndex]], ...offsets.slice(fileIndex + 1)])
        transformedData[fileIndex][labelIndex] = data[fileIndex][labelIndex].map(val => val * (scales[fileIndex][labelIndex] ?? DEFAULT_SCALING_FACTOR) + (offset ?? 0))
        setTransformedData([...transformedData.slice(0, fileIndex), [...transformedData[fileIndex]], ...transformedData.slice(fileIndex + 1)])
        setMinMaxChartValues(data)
        computeSetSfcData(transformedData, bitsPerSignal, undefined, true)
    };

    const onBitsPerSignalChanged = (bits: number | string) => {
        setBitsPerSignal(bits)
        computeSetSfcData(transformedData, bits, undefined, true)
    };

    const computeSetSfcData = (transformedDataArrays: number[][][], bitsPerSignal: number | string,
                               newEncoder?: string, setMinMaxValues?: boolean, initialMinMaxValues?: boolean) => {
        const allSfcData: number[][] = []
        const allMinSfcValues: number[] = []
        const allMaxSfcValues: number[] = []

        transformedDataArrays.forEach(transformedData => {
            const truncatedData = transformedData.map(column => column.map(value =>
                Math.trunc(value))) // Add truncating processing
            const currentEncoder = newEncoder ?? encoder
            const sfcData = currentEncoder === 'morton' ? mortonInterlace(truncatedData, Number(typeof bitsPerSignal == 'string' ? DEFAULT_BITS_PER_SIGNAL : bitsPerSignal)).reverse()
                : hilbertEncode(truncatedData, Number(typeof bitsPerSignal == 'string' ? DEFAULT_BITS_PER_SIGNAL : bitsPerSignal)).reverse()
            if (setMinMaxValues) {
                const sfcSorted = [...sfcData!].sort((a, b) => a - b)
                allMaxSfcValues.push(sfcSorted[sfcSorted.length - 1])
                allMinSfcValues.push(sfcSorted[0])
            }

            allSfcData.push(sfcData)
        })

        console.log(allMinSfcValues)

        if (setMinMaxValues) {
            setMinSfcValues(allMinSfcValues)
            setMaxSfcValues(allMaxSfcValues)

            if (initialMinMaxValues) {
                setInitialMinSfcValues(allMinSfcValues)
                setInitialMaxSfcValues(allMaxSfcValues)
            }
        }

        setSfcData(allSfcData)
    }

    const onEncoderSwitch = () => {
        if (encoder === 'morton' && Number(bitsPerSignal) * data.length > 64) {
            alert("It is not possible to encode the signals with Hilbert with so many bits. Please reduce the number of bits per signal. Num signals * num bits <= 64!")
            return
        }
        const newEncoder = encoder === 'morton' ? 'hilbert' : 'morton'
        computeSetSfcData(transformedData, bitsPerSignal, newEncoder, true)
        setEncoder(newEncoder)
    };

    const onDataLabelsSet = (newLabels: string[]) => {
        setDisplayedDataLabels([...displayedDataLabels?.slice(0, fileToSelectColumnsFor) ?? [], newLabels,
            ...displayedDataLabels?.slice(fileToSelectColumnsFor + 1) ?? []])
    };

    const getMaxDisplayedNumLines = () => {
        return Math.max(...startLines.map((_, i) => endLines[i] - startLines[i]))
    };

    function onMinSfcValChanged(value: number, fileIndex: number) {
        minSfcValues[fileIndex] = value
        setMinSfcValues([...minSfcValues])
    }

    function onMaxSfcValuesChanged(value: number, fileIndex: number) {
        maxSfcValues[fileIndex] = value
        setMaxSfcValues([...maxSfcValues])
    }

    return <div id={'comp-demo-div'}>
        <h1>CSP comparison demo</h1>
        <div className={"charts"} id={'demo2-charts'}>
            <Chart name={"Encoded signals plot (CSP)"} data={data} transformedData={transformedData}
                   scales={scales} id={'demo2'} totalNumLines={getMaxDisplayedNumLines()}
                   offsets={offsets} minValue={minChartValue} maxValue={maxChartValue} type={"scatter"}
                   xAxisName={"Sfc value"} bitsPerSignal={bitsPerSignal}
                   yAxisName={"Time steps"} yAxisLabelPos={"right"} lineColors={LINE_COLORS}
                   sfcData={sfcData} minSfcRange={minSfcValues} maxSfcRange={maxSfcValues}/>
        </div>
        <div className={'global-transform-div control-container'}>
            <EncoderSwitch encoder={encoder} onSwitch={onEncoderSwitch} size={'small'}/>
            <>
                <span className={'input-label bits-label'}>Bits per signal</span>
                <label className={'input-label bits-label'}>
                    <input type={'number'} value={bitsPerSignal} min={1}
                           onBlur={() =>
                               onBitsPerSignalChanged!(Number(bitsPerSignal === ''
                                   ? DEFAULT_BITS_PER_SIGNAL
                                   : bitsPerSignal))}
                           onChange={(e) =>
                               onBitsPerSignalChanged!(e.target.value ? Number(e.target.value) : '')}/>
                </label>
            </>
        </div>
        {fileNames.map((fileName, i) => {
            return <div className={"controls"} id={'demo2-controls'} key={i}>
                <div className={'control-container comparison-row-div'}>
                    <div className={'left-control-grid'}>
                        <div className={'first-buttons-column'}>
                            <FormControlLabel control={<Checkbox defaultChecked
                                                         sx={{color: LINE_COLORS[i], '&.Mui-checked': {color: LINE_COLORS[i],}}}/>}
                                              label="Show" className={'show-checkbox'}/>
                            <FormControlLabel control={<IconButton onClick={e => {
                            }}>
                                <DeleteIcon/>
                            </IconButton>} label={'Delete'} className={'delete-row-button'}/>
                        </div>
                        <div className={"file-container"}>
                            <UploadButton onClick={e => uploadFile(e, i)} label={"Upload file..."}
                                          currentFile={fileName.replace(/.\//, "")}/>
                        </div>
                        <div className={"control-container"} id={"range-container"}>
                            <h3>Displayed range</h3>
                            <DataRangeSlider dataRangeChartStart={startLines[i]}
                                             dataRangeChartEnd={endLines[i]}
                                             numLines={dataNumLines[i]}
                                             onChange={(e, newValue) => onZoomSliderChange(e, newValue, i)}/>
                            <div className={"text-controls"}>
                                <label className={"input-label"}>
                                    Start row:
                                    <input type="number" value={startLines[i]}
                                           onChange={(e) => {
                                               startLines[i] = Number(e.target.value)
                                               setStartLines([...startLines])
                                           }}/>
                                </label>
                                <label className={"input-label"}>
                                    End row:
                                    <input type="number" value={endLines[i]}
                                           onChange={(e) => {
                                               endLines[i] = Number(e.target.value)
                                               setEndLines([...endLines])
                                           }}/>
                                </label>
                            </div>
                        </div>
                    </div>
                    <ProcessingComponent displayedDataLabels={displayedDataLabels ? displayedDataLabels[i] : null}
                                         scales={scales[i]} offsets={offsets[i]}
                                         onScalesChanged={(index: number, scale: number | undefined) => onScalesChanged(index, scale, i)}
                                         onOffsetsChanged={(index: number, offset: number | undefined) => onOffsetsChanged(index, offset, i)}
                                         minSfcValue={minSfcValues[i]} setMinSfcValue={(val: number) => onMinSfcValChanged(val, i)}
                                         setMaxSfcValue={(val: number)=> onMaxSfcValuesChanged(val, i)}
                                         maxSfcValue={maxSfcValues[i]} initialMinSfcValue={initialMinSfcValues[i]}
                                         initialMaxSfcValue={initialMaxSfcValues[i]}
                                         resetBtnPos={'right'}/>
                </div>
            </div>
        })}
        <UploadButton onClick={e => uploadFile(e, fileNames.length)} label={"Upload file..."}
                      currentFile={''}/>
        <SelectColumnsDialog show={showDialog} setShow={setShowDialog} currentLabels={displayedDataLabels && fileToSelectColumnsFor > -1 ? displayedDataLabels[fileToSelectColumnsFor] : []}
                             allDataLabels={allDataLabelsRef.current && fileToSelectColumnsFor > -1
                                 ? allDataLabelsRef.current[fileToSelectColumnsFor]
                                 : []}
                             setDataLabels={onDataLabelsSet}/>
    </div>;
}