import React, {ChangeEvent, useEffect, useRef, useState} from "react";
import {DEFAULT_BITS_PER_SIGNAL, DEFAULT_OFFSET, DEFAULT_SCALING_FACTOR, PlayStatus} from "./App.tsx";
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

const preset = demoPreset5

export function CspComparisonDemo(e: React.ChangeEvent<HTMLInputElement>) {
    const EXAMPLE_FILE_PATHS = ['./emergency_braking.csv', './example-data.csv']
    const LINE_COLORS = ['blue', 'orange', 'green', 'red', 'purple', 'brown']

    const [filePaths, setFilePaths] = useState(EXAMPLE_FILE_PATHS)
    const [fileNames, setFileNames] = useState(EXAMPLE_FILE_PATHS)
    const DATA_POINT_INTERVAL = preset.dataPointInterval

    const [dataNumLines, setDataNumLines] = useState(-1)
    const [startLine, setStartLine] = useState(preset.dataRangeStart)
    const [endLine, setEndLine] = useState(preset.dataRangeEnd)

    const [encoder, setEncoder] = useState('morton')

    const [minSFCvalue, setMinSFCvalue] = useState(preset.sfcRangeMin)
    const [maxSFCvalue, setMaxSFCvalue] = useState(preset.sfcRangeMax)
    const [initialMinSFCvalue, setInitialMinSFCvalue] = useState(preset.sfcRangeMin)
    const [initialMaxSFCvalue, setInitialMaxSFCvalue] = useState(preset.sfcRangeMax)

    const [displayedDataLabels, setDisplayedDataLabels] = useState<string[][] | null>([
        ['accel_x', 'accel_y'],
        ['sampleTimeStamp.microseconds', 'groundSpeed']
    ]) // TODO: Revert to 'accel_x', 'accel_y', 'speed'

    const [data, setData] = useState<number[][]>([])
    const [transformedData, setTransformedData] = useState<number[][]>([]) // Transformed in "Transform" panel
    const [sfcData, setSfcData] = useState<number[]>([])

    // Use default scaling factor when scale is undefined (this to allow removing all digits in inputs)
    const [scales, setScales] = useState<(number | undefined)[]>([])
    const [offsets, setOffsets] = useState<(number | undefined)[]>([])
    const [bitsPerSignal, setBitsPerSignal] = useState<number | string>(DEFAULT_BITS_PER_SIGNAL)

    const allDataLabelsRef = useRef<string[][]>([])

    const [minChartValue, setMinChartValue] = useState<number>(-1)
    const [maxChartValue, setMaxChartValue] = useState<number>(-1)

    const [showDialog, setShowDialog] = useState(false)
    const [fileToSelectColumnsFor, setFileToSelectColumnsFor] = useState(-1)

    const loadFiles = () => {
        filePaths.forEach((filePath, i) => {
            fetch(filePath).then(r => {
                r.text().then(t => {
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

                        const sortedData = ([...column])
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

                    setMinChartValue(minData)
                    setMaxChartValue(maxData)
                    setDataNumLines(lines.length - 1)
                })
            })
        })

    }

    onresize = debounce(loadFiles)

    useEffect(() => {
        loadFiles()
    }, [startLine, endLine, displayedDataLabels, filePaths]);

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
                    setStartLine(0)
                    setEndLine(lines.length - 2) // -1 due to header row
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

    const onZoomSliderChange = (_: Event, newValue: number[] | number) => {
        setStartLine((newValue as number[])[0])
        setEndLine((newValue as number[])[1])
    };
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
        setMinMaxChartValues(data)
        computeSetSFCData(transformedData, bitsPerSignal, undefined, true)
    };

    const onOffsetsChanged = (index: number, offset: number | undefined) => {
        offsets[index] = offset
        setOffsets([...offsets])
        transformedData[index] = data[index].map(val => val * (scales[index] ?? DEFAULT_SCALING_FACTOR) + (offset ?? 0))
        setTransformedData(transformedData)
        setMinMaxChartValues(data)
        computeSetSFCData(transformedData, bitsPerSignal, undefined, true)
    };

    const onBitsPerSignalChanged = (bits: number | string) => {
        setBitsPerSignal(bits)
        computeSetSFCData(transformedData, bits, undefined, true)
    };

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

    const onDataLabelsSet = (newLabels: string[]) => {
        setDisplayedDataLabels([...displayedDataLabels?.slice(0, fileToSelectColumnsFor) ?? [], newLabels,
            ...displayedDataLabels?.slice(fileToSelectColumnsFor + 1) ?? []])
    };

    return <>
        <h1>CSP comparison demo</h1>
        <div className={"charts"} id={'demo2-charts'}>
            <Chart name={"Encoded signals plot (CSP)"} data={data} transformedData={transformedData}
                   scales={scales} id={'demo2'}
                   offsets={offsets} minValue={minChartValue} maxValue={maxChartValue} type={"scatter"}
                   xAxisName={"Morton"} bitsPerSignal={bitsPerSignal}
                   yAxisName={"Time steps"} yAxisLabelPos={"right"}
                   sfcData={sfcData} minSFCrange={minSFCvalue} maxSFCrange={maxSFCvalue}
                   encoderSwitch={<EncoderSwitch encoder={encoder} onSwitch={onEncoderSwitch}/>}/>
        </div>
        {fileNames.map((fileName, i) => {
            return <div className={"controls"} id={'demo2-controls'} key={i}>
                <div className={'control-container comparison-row-div'}>
                    <div className={'left-control-grid'}>
                        <div className={'first-buttons-column'}>
                            <FormControlLabel control={<Checkbox defaultChecked/>} label="Show"
                                              className={'show-checkbox'}/>
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
                            <DataRangeSlider dataRangeChartStart={startLine}
                                             dataRangeChartEnd={endLine}
                                             numLines={dataNumLines}
                                             onChange={(e, newValue) => onZoomSliderChange(e, newValue)}/>
                            <div className={"text-controls"}>
                                <label className={"input-label"}>
                                    Start row:
                                    <input type="number" value={startLine}
                                           onChange={(e) => setStartLine(Number(e.target.value))}/>
                                </label>
                                <label className={"input-label"}>
                                    End row:
                                    <input type="number" value={endLine}
                                           onChange={(e) => setEndLine(Number(e.target.value))}/>
                                </label>
                            </div>
                        </div>
                    </div>
                    <ProcessingComponent displayedDataLabels={displayedDataLabels ? displayedDataLabels[i] : null} lineColors={LINE_COLORS}
                                         scales={scales} offsets={offsets}
                                         bitsPerSignal={bitsPerSignal} onScalesChanged={onScalesChanged}
                                         onOffsetsChanged={onOffsetsChanged} minSFCvalue={minSFCvalue}
                                         setMinSFCvalue={setMinSFCvalue} setMaxSFCvalue={setMaxSFCvalue}
                                         maxSFCvalue={maxSFCvalue}
                                         initialMinSFCvalue={initialMinSFCvalue}
                                         initialMaxSFCvalue={initialMaxSFCvalue}
                                         onBitsPerSignalChanged={onBitsPerSignalChanged} resetBtnPos={'right'}/>
                </div>
            </div>
        })}

        <SelectColumnsDialog show={showDialog} setShow={setShowDialog} currentLabels={displayedDataLabels && fileToSelectColumnsFor > -1 ? displayedDataLabels[fileToSelectColumnsFor] : []}
                             allDataLabels={allDataLabelsRef.current && fileToSelectColumnsFor > -1 ? allDataLabelsRef.current[fileToSelectColumnsFor] : []} setDataLabels={onDataLabelsSet}/>
    </>;
}