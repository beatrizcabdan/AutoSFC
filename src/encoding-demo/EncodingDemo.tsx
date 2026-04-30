import React, {ChangeEvent, useEffect, useRef, useState} from "react";
import {createPath, debounce, hilbertEncode, mortonInterlace, scrollToSection} from "../utils.ts";
import {Preset, PresetComponent} from "../preset-component/PresetComponent.tsx";
import {Chart} from "../Chart.tsx";
import {EncoderSwitch} from "../EncoderSwitch.tsx";
import {UploadButton} from "../buttons/UploadButton.tsx";
import {PlaySlider} from "../PlaySlider.tsx";
import {PlayButton} from "../buttons/PlayButton.tsx";
import {DataRangeSlider} from "../data-range-slider/DataRangeSlider.tsx";
import {ProcessingComponent} from "../ProcessingComponent.tsx";
import {SelectColumnsDialog} from "../select-columns-dialog/SelectColumnsDialog.tsx";
import {API_BASE_URL, DEFAULT_BITS_PER_SIGNAL, DEFAULT_OFFSET, DEFAULT_SCALING_FACTOR, PlayStatus} from "../App.tsx";
import {demoPreset5} from "../presets.ts";
import './EncodingDemo.scss'
import '../controls.scss'
import App from '../App.module.scss'
import {useSearchParams} from "react-router-dom";
import axios from "axios";
import {SnackBar} from "../snackbar/SnackBar.tsx";
import {downloadZip} from "client-zip";
import {SelectScreenshotAreaDialog} from "./SelectScreenshotAreaDialog.tsx";
import html2canvas from "html2canvas";
import {ChooseDownloadLabelDialog} from "./ChooseDownloadLabelDialog.tsx";

const {primaryColor} = App

const preset = demoPreset5

interface EncodingDemoProps {
    onSectionClick: (path: string, sectionId: string) => void,
    navRef: React.MutableRefObject<HTMLDivElement | undefined>
}

export function EncodingDemo({onSectionClick, navRef}: EncodingDemoProps) {
    const SLIDER_START_VAL = 100
    const EXAMPLE_FILE_PATH = 'emergency_braking.csv'
    const LINE_COLORS = [primaryColor, 'orange', 'green', 'red', 'purple', 'brown']
    const MAKE_SCREENSHOT_WITH_SCREEN_CAPTURE = true
    const AUTO_SCROLL_TO_DEMO_TOP_BEFORE_SCREENSHOTS = true

    const [filePath, setFilePath] = useState(EXAMPLE_FILE_PATH)
    const [fileName, setFileName] = useState(EXAMPLE_FILE_PATH)
    const uploadedFileRef = useRef<File | undefined>()
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
    const [playStatus, setPlayStatus] = useState(PlayStatus.REACHED_END)
    const playbackIntervalRef = useRef(-1)

    const [showSelectColumnsDialog, setShowSelectColumnsDialog] = useState(false)

    const [currentPresetName, setCurrentPresetName] = useState('')
    const [presets, setPresets] = useState<Preset[] | null>()

    const [searchParams] = useSearchParams()

    const [snackbarMessage, setSnackbarMessage] = useState('')

    const chartsRef = useRef<HTMLDivElement>()
    const demoRef = useRef<HTMLDivElement>()

    const [showSelectScreenshotArea, setShowSelectScreenshotArea] = useState(false)
    const [showChooseLabelDialog, setShowChooseLabelDialog] = useState(false)
    const screenshotBlobRef = useRef<Blob | null>()
    const [downloadedDataLabel, setDownLoadedDataLabel] = useState('')

    const loadFile = () => {
        fetch(filePath).then(r => {
            r.text().then(t => {
                uploadedFileRef.current = new File([t], fileName)
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
        // Don't load default file if params has external file url
        if (searchParams.has('file') && filePath === EXAMPLE_FILE_PATH) {
            return
        }
        loadFile()
    }, [startLine, endLine, displayedDataLabels, filePath]);

    useEffect(() => {
        if (searchParams.has('file')) {
            getFileFromURL(searchParams.get('file'))
        }
    }, [searchParams]);

    function getFileFromURL(url: string | null) {
        if (url) {
            axios.post(API_BASE_URL, {'url': url},
                {headers: {'Content-Type': 'application/json'}})
                .then(r => {
                        if (r.data.error) {
                            console.error(r.data.error)
                        } else {
                            console.log(r.data)
                            const urlParts = url.split('/')
                            const fileName = urlParts[urlParts.length - 1]
                            const file = new File([r.data.fileContent], fileName)
                            readFile(r.data.fileContent, file)
                            scrollToSection('#encoding-demo')
                            setSnackbarMessage(r.data.msg)
                        }
                    },
                    error => {
                        console.error(`Remote file error: ${error.message}`)
                        alert(`Remote file error: ${error.message}`)
                    })
        }
    }

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
        if (searchParams?.has('autoplay', 'true')) {
            onPlayClick()
        }
        return () => clearInterval(playbackIntervalRef.current);
    }, []);

    function startPlayback() {
        // @ts-ignore
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
        if (!showSelectColumnsDialog) {
            setShowSelectColumnsDialog(true)
        }
    };

    const setDataLabels = (labels: string[]) => {
        setDisplayedDataLabels(labels)
        setShowSelectColumnsDialog(false)
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

    const readFile = (text: string, file: File) => {
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
        setFilePath(url)
        setFileName(file.name)
        setCurrentPresetName('')
    }

    function uploadFile(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.item(0)
        if (file?.type === 'text/csv') {
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result?.toString();
                if (text) {
                    readFile(text, file);
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
    }

    // Resume download after ChooseDownloadLabelDialog
    useEffect(() => {
        if (showChooseLabelDialog || !screenshotBlobRef.current) {
            return
        }

        // Uploaded file
        const uploadedFileBlob = uploadedFileRef.current

        // Encoded data
        const dataBlob = new Blob(sfcData.map(n => `${String(n)}\n`), {type: 'text/csv'})

        // Create preset from current transforms
        const newPreset = createPresetFromCurrParams()
        const presetBlob = new Blob([`[${JSON.stringify(newPreset, undefined, 1)}]`], {type: 'application/json'})

        // Zip data
        const baseFileName = fileName.replace('.csv', '')
        const date = new Date().toLocaleDateString('sv-SE').replace(/-/g, '')
            .slice(2) // Short year
        const dataFileName = `${date}_${baseFileName}_transformed_${encoder}_${bitsPerSignal}bps${downloadedDataLabel}.csv`
        const presetFileName = `${date}_${baseFileName}_transformations${downloadedDataLabel}.json`
        const screenshotFileName = `${date}_screenshot${downloadedDataLabel}.png`

        const downloadData = async () => {
            const zipped = await downloadZip([
                {name: dataFileName, input: new File([dataBlob], dataFileName)},
                {name: presetFileName, input: new File([presetBlob], presetFileName)},
                {name: fileName, input: uploadedFileBlob},
                // @ts-ignore
                {name: screenshotFileName, input: new File([screenshotBlobRef.current], screenshotFileName)}
            ]).blob()
            const zippedUrl = URL.createObjectURL(zipped)

            // Download
            const link = document.createElement("a");
            link.href = zippedUrl;
            link.download = `${date}_${baseFileName}${downloadedDataLabel}.zip`;
            link.click()
        }

        downloadData().then(() => {
            screenshotBlobRef.current = null
            setDownLoadedDataLabel('')
        })

    }, [showChooseLabelDialog]);

    const onDownloadData = async () => {
        // Screenshot
        let canvas: HTMLCanvasElement
        const captureScreenshot = async () => {
            if (MAKE_SCREENSHOT_WITH_SCREEN_CAPTURE) {
                canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                const video = document.createElement("video");

                try {
                    if (AUTO_SCROLL_TO_DEMO_TOP_BEFORE_SCREENSHOTS) {
                        const chartsYCoord = chartsRef.current?.getBoundingClientRect().top
                        // Need to scroll up [nav height] pixels more to not have charts occluded
                        const navHeight = navRef.current?.clientHeight ?? 0
                        if (chartsYCoord !== undefined) {
                            window.scrollBy({top: chartsYCoord - navHeight, behavior: 'smooth'})
                        }
                    }

                    video.srcObject = await navigator.mediaDevices.getDisplayMedia({
                        // @ts-ignore
                        preferCurrentTab: false, selfBrowserSurface: "exclude",
                        systemAudio: 'exclude', displaySurface: 'window', monitorTypeSurfaces: 'exclude',
                        surfaceSwitching: 'exclude', windowAudio: 'exclude'
                    });
                    await video.play()

                    const scaling = window.devicePixelRatio

                    canvas.width = window.innerWidth * scaling;
                    canvas.height = window.innerHeight * scaling;

                    const sy = (window.outerHeight - window.innerHeight) * scaling
                    const width = window.innerWidth * scaling
                    const height = window.innerHeight * scaling

                    context?.drawImage(video, 0, sy, width, height, 0, 0, width, height);
                } catch (err) {
                    console.error("Screenshot error: " + err);
                }
            } else {
                if (demoRef.current) {
                    canvas = await html2canvas(demoRef.current,
                        {ignoreElements: el => el.classList.contains('light-box')})
                } else {
                    console.error("chartsRef.current is undefined")
                }
            }

            canvas.toBlob(async screenshotBlob => {
                screenshotBlobRef.current = screenshotBlob
                setShowChooseLabelDialog(true)
            }, 'image/png', 1)
        };
        await captureScreenshot();
    }

    function createPresetName() {
        let presetSuffix = 1
        while (presets?.some(p => p.name === `preset_0${presetSuffix}`)) {
            presetSuffix++
        }
        return `preset_0${presetSuffix}`;
    }

    function createPresetFromCurrParams(includeName = true) {
        const obj = {
            signalStartRow: startLine,
            signalEndRow: endLine,
            cspStartRow: minSFCvalue,
            cspEndRow: maxSFCvalue,
            bitsPerSignal: bitsPerSignal === '' ? DEFAULT_BITS_PER_SIGNAL : Number(bitsPerSignal),
            signalTransforms: displayedDataLabels?.map((name, i) => {
                return {
                    signalName: String(name),
                    offset: offsets[i] ?? DEFAULT_OFFSET,
                    scaling: scales[i] ?? DEFAULT_SCALING_FACTOR
                }
            }) ?? [],
            encoder: encoder,
            plotTransformedSignals: showSignalTransforms
        };
        if (includeName) {
            Object.assign(obj, {name: createPresetName()})
        }
        return obj
    }

    const onChooseLabelDialogClick = (label?: string) => {
        if (label) {
            setDownLoadedDataLabel(`_${label}`)
        }
        setShowChooseLabelDialog(false);
    }

    // @ts-ignore
    return <div id={'encoding-demo'} ref={demoRef}>
        <h1>
            <a href={createPath('#encoding-demo', searchParams)}
               onClick={e => e.preventDefault()}>
                <span className={'section-hash-span'}
                      onClick={() => onSectionClick(createPath('#encoding-demo', searchParams),
                          '#encoding-demo')}>#</span></a>Encoding demo
        </h1>
        <p className={'demo-description-p'}>The AutoSFC encoding demo allows researchers to visualize and adjust
            parameters in real time, and to apply transformations on the input signal in real time. Once a file is
            uploaded, the tool parses the CSV data and loads the signals into memory. After loading, it activates the
            interactive plotting components and parameter controls. For all details on how to use this demo, please
            check our <a href="https://www.youtube.com/watch?v=8JFxoLYusc0">video tutorial</a>.</p>
        { /* @ts-ignore */}
        <div className={"charts"} ref={chartsRef}>
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
        <div className={'controls'}>
            <div className={"vert-control-wrapper"}>
                <div className={"control-container"} id={"first-control-row"}>
                    <div className={"file-container"}>
                        <h3>Current file</h3>
                        <UploadButton onClick={uploadFile} label={"Upload file..."} getWrappingDiv={true}
                                      getFileNameP={true}
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
                                         presets={presets} setPresets={setPresets}
                                         createPresetFromCurrParams={createPresetFromCurrParams}
                                         currentDataFile={fileName.replace(/.\//, "")}/>
                    </div>
                </div>
            </div>
            <div className={"vert-control-wrapper"}>
                <div className={"vert-control-wrapper"}>
                    <ProcessingComponent variant={'full'} displayedDataLabels={displayedDataLabels}
                                         lineColors={LINE_COLORS}
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
                                         onDownloadData={() => setShowSelectScreenshotArea(true)}
                                         encoderSwitch={<EncoderSwitch encoder={encoder} onSwitch={onEncoderSwitch}
                                                                       size={'small'}
                                                                       className={'encoder-label'}/>}
                    />
                </div>
            </div>
        </div>

        <SelectColumnsDialog show={showSelectColumnsDialog} setShow={setShowSelectColumnsDialog}
                             currentLabels={displayedDataLabels}
                             demoName={'encoding'}
                             allDataLabels={allDataLabelsRef.current ?? []} setDataLabels={setDataLabels}/>
        <SnackBar msg={snackbarMessage}/>
        <SelectScreenshotAreaDialog autoScroll={AUTO_SCROLL_TO_DEMO_TOP_BEFORE_SCREENSHOTS}
                                    blurBackground={AUTO_SCROLL_TO_DEMO_TOP_BEFORE_SCREENSHOTS}
                            show={showSelectScreenshotArea} onClick={async () => {
            setShowSelectScreenshotArea(false)
            await onDownloadData()
        }} onCancel={() => setShowSelectScreenshotArea(false)}/>
        <ChooseDownloadLabelDialog show={showChooseLabelDialog} onChoose={(label: string) => onChooseLabelDialogClick(label)}
                                   onCancel={() => onChooseLabelDialogClick()}/>
    </div>;
}