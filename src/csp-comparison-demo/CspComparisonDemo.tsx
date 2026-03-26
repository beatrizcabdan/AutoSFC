import React, {ChangeEvent, MutableRefObject, useEffect, useRef, useState} from "react";
import {DEFAULT_BITS_PER_SIGNAL, DEFAULT_OFFSET, DEFAULT_SCALING_FACTOR} from "../App.tsx";
import {createPath, debounce, hilbertEncode, mortonInterlace} from "../utils.ts";
import {Chart} from "../Chart.tsx";
import {EncoderSwitch} from "../EncoderSwitch.tsx";
import {UploadButton} from "../buttons/UploadButton.tsx";
import {DataRangeSlider} from "../data-range-slider/DataRangeSlider.tsx";
import {ProcessingComponent} from "../ProcessingComponent.tsx";
import {SelectColumnsDialog} from "../select-columns-dialog/SelectColumnsDialog.tsx";
import {default_demo2} from "../presets.ts";
import './CspComparisonDemo.scss'
import {Checkbox, FormControlLabel, IconButton, Zoom} from "@mui/material";
import App from '../App.module.scss'
import '../controls.scss'
import {useSearchParams} from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import {ChevronRight} from "@mui/icons-material";

const {primaryColor} = App

const preset = default_demo2

export const SMALL_SCREEN_LIMIT = 700

// TODO:  more compact layout (show show-button, delete-button, upload file-button, filename, displayed signals (no controls)), presets... (later)

interface CspComparisonDemoProps {
    onSectionClick: (path: string, sectionId: string) => void
}

function DataRangeContainer(props: {
    fileIndex: number,
    startLines: number[],
    endLines: number[],
    dataNumLines: number[],
    setStartLines: (value: (((prevState: number[]) => number[]) | number[])) => void,
    setEndLines: (value: (((prevState: number[]) => number[]) | number[])) => void,
    onZoomSliderChange: (_: Event, newValue: (number[] | number), fileIndex: number) => void,
    hide?: boolean,
    className?: string,
    lineColors: string[],
    color: string
}) {
    const [idx, startLines, endLines, hide, setStartLines, setEndLines, onZoomSliderChange, className, lineColors, color] =
        [props.fileIndex, props.startLines, props.endLines, props.hide, props.setStartLines, props.setEndLines,
            props.onZoomSliderChange, props.className, props.lineColors, props.color]
    return <div className={`control-container ${className} ${hide ? 'hide' : ''}`} id={"range-container"}>
        <h3>Displayed range</h3>
        <DataRangeSlider dataRangeChartStart={startLines[idx]}
                         dataRangeChartEnd={endLines[idx]} color={color}
                         numLines={props.dataNumLines[idx]} idx={idx} lineColors={lineColors}
                         onChange={(e, newValue) => onZoomSliderChange(e, newValue, idx)}/>
        <div className={"text-controls"}>
            <label className={"input-label"}>
                Start row
                <input type="number" value={startLines[idx]}
                       onChange={(e) => {
                           startLines[idx] = Number(e.target.value)
                           setStartLines([...startLines])
                       }}/>
            </label>
            <label className={"input-label"}>
                End row
                <input type="number" value={endLines[idx]}
                       onChange={(e) => {
                           endLines[idx] = Number(e.target.value)
                           setEndLines([...endLines])
                       }}/>
            </label>
        </div>
    </div>;
}

export function CspComparisonDemo({onSectionClick}: CspComparisonDemoProps) {
    const EXAMPLE_FILE_PATHS = [preset.file1, preset.file2]
    const LINE_COLORS = [primaryColor, 'green', 'red', 'purple', 'brown', 'orange']
    const LARGE_SCREEN_SIGNAL_ROW_HEIGHT = 1.7 // rem
    const SMALL_SCREEN_SIGNAL_ROW_HEIGHT = 1.6 // rem
    const FILLED_DISPLAY_LABELS = false // Minimized controls

    const [lineColors, setLineColors] = useState(LINE_COLORS.slice(0, 2))

    const [filePaths, setFilePaths] = useState(EXAMPLE_FILE_PATHS)
    const [fileNames, setFileNames] = useState(EXAMPLE_FILE_PATHS)
    const DATA_POINT_INTERVAL = preset.dataPointInterval

    const [dataNumLines, setDataNumLines] = useState<number[]>([100, 100])
    const [startLines, setStartLines] = useState<number[]>([20, 0])
    const [endLines, setEndLines] = useState<number[]>([690, 590])

    const [encoder, setEncoder] = useState('morton')

    const [minSfcValues, setMinSfcValues] = useState<number[]>([])
    const [maxSfcValues, setMaxSfcValues] = useState<number[]>([])
    const [initialMinSfcValues, setInitialMinSfcValues] = useState<number[]>([])
    const [initialMaxSfcValues, setInitialMaxSfcValues] = useState<number[]>([])

    const allDataLabelsRef = useRef<string[][]>([])
    const [displayedDataLabels, setDisplayedDataLabels] = useState<string[][] | null>([
        preset.file1_signals,
        preset.file2_signals
    ])

    const [data, setData] = useState<number[][][]>([])
    const [transformedData, setTransformedData] = useState<number[][][]>([]) // Transformed in "Transform" panel
    const [sfcData, setSfcData] = useState<number[][]>([])

    // Use default scaling factor when scale is undefined (this to allow removing all digits in inputs)
    const [scales, setScales] = useState<(number | undefined)[][]>([preset.file1_scales, preset.file2_scales])
    const [offsets, setOffsets] = useState<(number | undefined)[][]>([preset.file1_offsets, preset.file2_offsets])
    const [bitsPerSignal, setBitsPerSignal] = useState<number | string>(preset.bitsPerSignal)

    const [plotFile, setPlotFile] = useState([true, true])
    const [minimizeFileControls, setMinimizeFileControls] = useState([true, true])

    const [deletedFileIndex, setDeletedFileIndex] = useState(-1)
    const [fileCountIncreased, setFileCountIncreased] = useState(false)

    const [minChartValue, setMinChartValue] = useState<number>(-1)
    const [maxChartValue, setMaxChartValue] = useState<number>(-1)

    const [showDialog, setShowDialog] = useState(false)
    const [fileToSelectColumnsFor, setFileToSelectColumnsFor] = useState(-1)

    const [searchParams] = useSearchParams()

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

    const selectDataColumns = (fileIndex: number) => {
        if (!showDialog) {
            setFileToSelectColumnsFor(fileIndex)
            setShowDialog(true)
        }
    };

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

    function uploadFile(e: ChangeEvent<HTMLInputElement>, fileIndex: number, minimizeControls?: boolean) {
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
                        ...(displayedDataLabels ?? []).slice(0, fileIndex),
                        dataLabels.slice(dataLabels.length - 2), // Use last two columns as default
                        ...(displayedDataLabels ?? []).slice(fileIndex + 1)
                    ])
                    startLines[fileIndex] = 0
                    setStartLines([...startLines])
                    endLines[fileIndex] = lines.length - 2 // -1 due to header row
                    setEndLines([...endLines])
                    const url = URL.createObjectURL(file)
                    setFileNames([...fileNames.slice(0, fileIndex), file.name, ...fileNames.slice(fileIndex + 1)])
                    setFilePaths([...filePaths.slice(0, fileIndex), url, ...filePaths.slice(fileIndex + 1)])
                    setOffsets([...offsets.slice(0, fileIndex), Array(2).fill(DEFAULT_OFFSET), ...offsets.slice(fileIndex + 1)])
                    setScales([...scales.slice(0, fileIndex), Array(2).fill(DEFAULT_SCALING_FACTOR), ...scales.slice(fileIndex + 1)])
                    setPlotFile([...plotFile.slice(0, fileIndex), true, ...plotFile.slice(fileIndex + 1)])
                    setMinimizeFileControls([...minimizeFileControls.slice(0, fileIndex), !!minimizeControls,
                        ...minimizeFileControls.slice(fileIndex + 1)])

                    // Only add new color if increasing number of files
                    if (fileIndex === lineColors.length) {
                        const availableColors = LINE_COLORS.filter(color => !lineColors.includes(color))
                        const newColor = availableColors.length > 0 ? availableColors[0] : LINE_COLORS[lineColors.length % LINE_COLORS.length]
                        setLineColors([...lineColors, newColor])
                    }
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
        setShowDialog(false)
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

    function onShowCheckboxClick(e: React.ChangeEvent<HTMLInputElement>, fileIndex: number) {
        plotFile[fileIndex] = e.target.checked
        setPlotFile([...plotFile])
    }

    function removeFileName(fileIndex: number) {
        setLineColors([...lineColors.slice(0, fileIndex), ...lineColors.slice(fileIndex + 1)])
        setFileNames([...fileNames.slice(0, fileIndex), ...fileNames.slice(fileIndex + 1)])
        setFilePaths([...filePaths.slice(0, fileIndex), ...filePaths.slice(fileIndex + 1)])
        setDataNumLines([...dataNumLines.slice(0, fileIndex), ...dataNumLines.slice(fileIndex + 1)])
        setStartLines([...startLines.slice(0, fileIndex), ...startLines.slice(fileIndex + 1)])
        setEndLines([...endLines.slice(0, fileIndex), ...endLines.slice(fileIndex + 1)])
        setMinSfcValues([...minSfcValues.slice(0, fileIndex), ...minSfcValues.slice(fileIndex + 1)])
        setMaxSfcValues([...maxSfcValues.slice(0, fileIndex), ...maxSfcValues.slice(fileIndex + 1)])
        setInitialMaxSfcValues([...initialMaxSfcValues.slice(0, fileIndex), ...initialMaxSfcValues.slice(fileIndex + 1)])
        setInitialMinSfcValues([...initialMinSfcValues.slice(0, fileIndex), ...initialMinSfcValues.slice(fileIndex + 1)])
        setDisplayedDataLabels([...displayedDataLabels!.slice(0, fileIndex), ...displayedDataLabels!.slice(fileIndex + 1)])
        setData([...data.slice(0, fileIndex), ...data.slice(fileIndex + 1)])
        setTransformedData([...transformedData.slice(0, fileIndex), ...transformedData.slice(fileIndex + 1)])
        setSfcData([...sfcData.slice(0, fileIndex), ...sfcData.slice(fileIndex + 1)])
        setScales([...scales.slice(0, fileIndex), ...scales.slice(fileIndex + 1)])
        setOffsets([...offsets.slice(0, fileIndex), ...offsets.slice(fileIndex + 1)])
        setPlotFile([...plotFile.slice(0, fileIndex), ...plotFile.slice(fileIndex + 1)])
        setMinimizeFileControls([...minimizeFileControls.slice(0, fileIndex), ...minimizeFileControls.slice(fileIndex + 1)])
        allDataLabelsRef.current = [...allDataLabelsRef.current.slice(0, fileIndex), ...allDataLabelsRef.current.slice(fileIndex + 1)]
        setFileToSelectColumnsFor(-1)

        setDeletedFileIndex(-1)
    }

    const addExtraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileCountIncreased(true)
        uploadFile(e, fileNames.length);
    }
    const onZoomAnimationFinished = (i: number) => {
        removeFileName(i);
        setFileCountIncreased(false)
    }

    function onDropDownBtnClick(fileIndex: number) {
        const current = minimizeFileControls[fileIndex]
        setMinimizeFileControls([...minimizeFileControls.slice(0, fileIndex),
            !current, ...minimizeFileControls.slice(fileIndex + 1)])
    }

    function ShowCheckBox(props: { index: number }) {
        return <FormControlLabel
            control={<Checkbox checked={plotFile[props.index]} onChange={e => onShowCheckboxClick(e, props.index)}
                               sx={{color: lineColors[props.index], '&.Mui-checked': {color: lineColors[props.index],}}}/>}
            label="Show" className={'show-checkbox'}/>;
    }

    function DeleteButton(props: { index: number }) {
        return <FormControlLabel control={<IconButton onClick={e => {
        }}>
            <DeleteIcon />
        </IconButton>} onClick={() => filePaths.length > 1 && setDeletedFileIndex(props.index)}
                                 label={'Delete'} className={'delete-row-button'} disabled={filePaths.length === 1}/>;
    }

    // Compute explicit control height for transitions
    function getControlHeight(numOfSignals: number, minimize: boolean) {
        if (window.innerWidth <= SMALL_SCREEN_LIMIT) {
            return minimize ? '5.0rem'
                : numOfSignals <= 3 ? '32rem'
                : numOfSignals === 4 ? '33rem'
                : `${33 + SMALL_SCREEN_SIGNAL_ROW_HEIGHT * (numOfSignals - 4)}rem`;
        }

        return minimize ? '6.8rem'
            : numOfSignals <= 3 ? '13rem'
            : numOfSignals === 4 ? '14.1rem'
            : `${14.1 + LARGE_SCREEN_SIGNAL_ROW_HEIGHT * (numOfSignals - 4)}rem`;
    }

    return <div id={'comparison-demo'}>
        <h1>
            <a href={createPath('#comparison-demo', searchParams)}
               onClick={e => e.preventDefault()}>
                <span className={'section-hash-span'} onClick={() => onSectionClick(createPath('#comparison-demo', searchParams),'#comparison-demo')}>
                    #</span>
            </a>
            CSP comparison demo</h1>
        <p className={'demo-description-p'}>The CSP comparison demo overlays multiple CSPs to visually compare the
            multi-modal data points after dimensionality reduction to find similarities and differences. Once files are
            uploaded, the tool parses the CSV data, loads the signals, and renders the CSPs into the same plot.
            Alternatively, you can upload the same data point multiple times in order to compare the CSPs with different
            transformations applied to the original input signals. For all details on how to use this demo, please check
            our <a href="https://youtu.be/8JFxoLYusc0?si=7UqcdqHZnDmyZETc&t=258">video tutorial</a>.</p>
        <div className={"charts"} id={'demo2-charts'}>
            <Chart name={"Encoded signals plot (CSP)"} data={data} transformedData={transformedData}
                   scales={scales} id={'demo2'} totalNumLines={getMaxDisplayedNumLines()}
                   offsets={offsets} minValue={minChartValue} maxValue={maxChartValue} type={"scatter"}
                   xAxisName={"Sfc value"} bitsPerSignal={bitsPerSignal}
                   yAxisName={"Time steps"} yAxisLabelPos={"right"} lineColors={lineColors}
                   sfcData={sfcData} minSfcRange={minSfcValues} maxSfcRange={maxSfcValues} plotFile={plotFile}/>
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
            return <div className={'controls-wrapper'} key={i}>
                <Zoom appear={i !== deletedFileIndex} in={i !== deletedFileIndex}
                      timeout={i === deletedFileIndex || fileCountIncreased && i === filePaths.length - 1 ? 200 : 0}
                      onExited={() => onZoomAnimationFinished(i)}>
                    <div className={"controls"} id={'demo2-controls'} key={i}>
                        <div className={'control-container comparison-row-div'}
                             style={{height: getControlHeight(displayedDataLabels ? displayedDataLabels[i].length : 0, minimizeFileControls[i])}}>
                            <div className={`left-control-grid ${minimizeFileControls[i] ? 'minimized' : ''}`}>
                                <div className={'first-buttons-column'}>
                                    <FormControlLabel className={'dropdown-button'} control={<IconButton disableRipple={true} aria-label="maximize/minimize"
                                            onClick={() => onDropDownBtnClick(i)}>
                                        <ChevronRight sx={{scale: 1.0, rotate: minimizeFileControls[i] ? '0' : '90deg'}}/>
                                    </IconButton>} label={undefined}/>
                                    <div className={`lower-buttons-div ${minimizeFileControls[i] ? 'hide' : ''}`}>
                                        <ShowCheckBox index={i}/>
                                        <DeleteButton index={i}/>
                                    </div>
                                </div>
                                <div className={`file-container ${minimizeFileControls[i] ? 'hide' : ''}`}>
                                    <UploadButton onClick={e => uploadFile(e, i, minimizeFileControls[i])} label={"Upload file..."}
                                                  currentFile={fileName.replace(/.\//, "")}
                                                  getWrappingDiv={true} getFileNameP={true}/>
                                </div>
                                <DataRangeContainer fileIndex={i} startLines={startLines} endLines={endLines} hide={minimizeFileControls[i]}
                                                    dataNumLines={dataNumLines} setStartLines={setStartLines} lineColors={LINE_COLORS} color={lineColors[i]}
                                                    setEndLines={setEndLines} onZoomSliderChange={onZoomSliderChange}/>

                                {/*Minimized controls*/}
                                <UploadButton onClick={e => uploadFile(e, i, minimizeFileControls[i])} label={"Upload file..."}
                                              getFileNameP={false} getWrappingDiv={false}/>
                                <h3 className={'upload-button-minimized-label'}>{fileName}</h3>
                                <Checkbox id={`show-checkbox-${i}`} className={'show-checkbox-minimized'} checked={plotFile[i]} onChange={e => onShowCheckboxClick(e, i)}
                                          sx={{color: lineColors[i], '&.Mui-checked': {color: lineColors[i],}}}/>
                                <h3 className={'show-checkbox-minimized-label'}
                                    onClick={() => (document.querySelector(`#show-checkbox-${i}`) as HTMLDivElement).click()}>Show</h3>
                                <IconButton className={'delete-row-button-minimized'} onClick={() => filePaths.length > 1 && setDeletedFileIndex(i)}
                                            disabled={filePaths.length === 1}>
                                    <DeleteIcon />
                                </IconButton>
                                <h3 className={`delete-button-minimized-label ${filePaths.length === 1 ? 'disabled' : ''}`}
                                    onClick={() => filePaths.length > 1 && setDeletedFileIndex(i)}>Delete</h3>
                                <div className={'displayed-signals-wrapper-minimized-div'}
                                     onClick={() => selectDataColumns(i)}>
                                    <h3>Displayed signals</h3>
                                    <p className={`legend-msg`}>Choose signals...</p>
                                    <div className={'displayed-signals-div'}>
                                        {displayedDataLabels ? displayedDataLabels[i].map(label =>
                                            <span className={FILLED_DISPLAY_LABELS ? 'solid-bg' : ''} key={label}
                                                  style={{background: FILLED_DISPLAY_LABELS ? lineColors[i] : 'white'}}>{label}
                                            </span>) : null}
                                    </div>
                                </div>
                                <DataRangeContainer fileIndex={i} startLines={startLines} endLines={endLines} hide={!minimizeFileControls[i]}
                                                    dataNumLines={dataNumLines} setStartLines={setStartLines} className={'minimized'} color={lineColors[i % lineColors.length]}
                                                    setEndLines={setEndLines} lineColors={LINE_COLORS} onZoomSliderChange={onZoomSliderChange}/>
                            </div>

                            <div className={`processing-component-wrapper ${minimizeFileControls[i] ? 'hide' : ''}`}>
                                <ProcessingComponent variant={'reduced'}
                                                     displayedDataLabels={displayedDataLabels ? displayedDataLabels[i] : null}
                                                     scales={scales[i]} offsets={offsets[i]}
                                                     onScalesChanged={(index: number, scale: number | undefined) => onScalesChanged(index, scale, i)}
                                                     onOffsetsChanged={(index: number, offset: number | undefined) => onOffsetsChanged(index, offset, i)}
                                                     minSfcValue={minSfcValues[i]}
                                                     setMinSfcValue={(val: number) => onMinSfcValChanged(val, i)}
                                                     setMaxSfcValue={(val: number) => onMaxSfcValuesChanged(val, i)}
                                                     maxSfcValue={maxSfcValues[i]} initialMinSfcValue={initialMinSfcValues[i]}
                                                     initialMaxSfcValue={initialMaxSfcValues[i]}
                                                     onChooseColumnsClick={() => selectDataColumns(i)}
                                                     resetBtnPos={'right'}/>
                            </div>
                        </div>
                    </div>
                </Zoom>
            </div>
        })}
        <UploadButton onClick={e => addExtraFile(e)} label={"Upload file..."}
                      currentFile={''} getWrappingDiv={true} getFileNameP={true}/>
        <SelectColumnsDialog show={showDialog} setShow={setShowDialog} demoName={'comparison'}
                             currentLabels={displayedDataLabels && fileToSelectColumnsFor > -1
                                 ? displayedDataLabels[fileToSelectColumnsFor]
                                 : []}
                             allDataLabels={allDataLabelsRef.current && fileToSelectColumnsFor > -1
                                 ? allDataLabelsRef.current[fileToSelectColumnsFor]
                                 : []}
                             setDataLabels={onDataLabelsSet}/>
    </div>;
}