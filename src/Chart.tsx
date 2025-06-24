/* eslint-disable @typescript-eslint/ban-ts-comment*/

import React, {useEffect, useRef, useState} from "react";
import {makeGaussKernel} from "./utils.ts";
import {Legend} from "./Legend.tsx";

function getSmoothedData(data: number[], smoothing: number) {
    const smoothedArr: number[] = []
    const kernel = makeGaussKernel(smoothing)
    const tailLen = Math.floor(kernel.length / 2)
    const edgeMirroredData = [...data.slice(0, tailLen).reverse(), ...data,
        ...data.slice(data.length - tailLen).reverse()]
    for (let i = 0; i < edgeMirroredData.length - kernel.length + 1; i++) {
        let smoothed = 0
        for (let j = 0; j < kernel.length; j++) {
            smoothed += edgeMirroredData[i + j] * kernel[j]
        }
        smoothedArr.push(smoothed)
    }
    return smoothedArr
}

export function Chart(props: {
    name: string,
    data: number[][] | number[][][],
    scales: (number | undefined)[] | (number | undefined)[][],
    type: string,
    xAxisName: string,
    yAxisName: string,
    yAxisLabelPos: string,
    maxValue: number,
    minValue: number,
    legendLabels?: string[] | null,
    currentSignalXVal?: number,
    startTimeXticks?: number,
    finishTimeXticks?: number,
    lineDataSmoothing?: number,
    onLegendClick?: () => void,
    lineColors?: string[],
    offsets: (number | undefined)[] | (number | undefined)[][],
    bitsPerSignal?: number | string,
    transformedData: number[][] | number[][][],
    minSFCrange?: number,
    maxSFCrange?: number,
    sfcData?: number[] | number[][],
    encoderSwitch?: React.JSX.Element,
    id?: string,
    numLines?: number
}) {
    const PLOT_NUM_Y_VALUES = 8
    const PLOT_NUM_X_VALUES = 9
    const MORTON_PLOT_LEFT_Y_VALUES = [0, 0.2, 0.4, 0.6, 0.8, 1.0]

    const AXIS_PADDING_FACTOR = 0
    const CURVE_PADDING_FACTOR = AXIS_PADDING_FACTOR + 0.04 // TODO: Get val from CSS
    const LEFT_AXIS_EXTRA_PADDING = 0
    const LEFT_AXIS_E_NOTATION_EXTRA_PADDING = 0
    const MAX_Y_AXIS_DIGITS = 4

    const LINE_WIDTH = 4
    const MARKER_RADIUS = 12
    const MORTON_BAR_WIDTH = 4
    const MORTON_PIXEL_DIAM = 8

    const [xTickMarks, setXTickMarks] = useState<string[]>([])
    const [yTickMarks, setYTickMarks] = useState<string[]>([])
    const [mortonRightYValues, setMortonRightYValues] = useState<string[]>([])

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const curvePaddingRef = useRef(0)

    console.log(props)

    //TODO: null ctx is not ok null check todo
    //@ts-ignore
    let ctx: CanvasRenderingContext2D

    // Draw axis & axis labels
    function getLineX(i: number, canvas: HTMLCanvasElement, padding: number, leftExtraPadding: number) {
        return (i / (props.data[0].length - 1)) * (canvas.width - padding * 2 - leftExtraPadding) + padding + leftExtraPadding;
    }

    function getScatterX(i: number, canvas: HTMLCanvasElement, padding: number) {
        const numLines = props.numLines ?? props.data[0].length - 1
        return (i / numLines) * (canvas.height - padding * 2) + padding
    }

    function getLineY(canvas: HTMLCanvasElement, curvePadding: number, point: number) {
        return (canvas.height - curvePadding * 2) * (props.maxValue - point) / (props.maxValue - props.minValue) + curvePadding;
    }

    const drawSfcBar = (canvas: HTMLCanvasElement, curvePadding: number, m: number,
                        minMorton: number, maxMorton: number, markerIndex: number, axisPadding: number, fileIndex?: number) => {
        const curveCanvasWidth = canvas.width - curvePadding * 2 - LEFT_AXIS_EXTRA_PADDING
        const y = curveCanvasWidth * (m - minMorton) / (maxMorton - minMorton) + curvePadding + LEFT_AXIS_EXTRA_PADDING

        const barX = y - MORTON_BAR_WIDTH / 2
        const sfcData = (fileIndex !== undefined ? props.sfcData![fileIndex] : props.sfcData) as unknown as number[]

        const signalX = curveCanvasWidth * (sfcData[sfcData.length - 1 - markerIndex] - minMorton)
            / (maxMorton - minMorton) + curvePadding
        const currentBarDistance = Math.abs(barX - signalX) / curveCanvasWidth

        const defaultColor = {r: 204, g: 204, b: 204}
        // Only partially color SFC plot if there's a play position
        const markedColor = props.currentSignalXVal === undefined
            ? {r: 204, g: 204, b: 204}
            : {r: 0, g: 150, b: 255}
        const coloredWidth = 0.03
        const markedWeight = Math.max(coloredWidth - currentBarDistance, 0) / coloredWidth

        ctx.fillStyle = `rgb(
                        ${markedColor.r * markedWeight + defaultColor.r * (1 - markedWeight)},
                        ${markedColor.g * markedWeight + defaultColor.g * (1 - markedWeight)},
                        ${markedColor.b * markedWeight + defaultColor.b * (1 - markedWeight)})`
        ctx.fillRect(barX, axisPadding, MORTON_BAR_WIDTH, canvas.height - 2 * axisPadding)
    }

    const drawSfcPoint = (i: number, canvas: HTMLCanvasElement, curvePadding: number,
                          m: number, minMorton: number, maxMorton: number, markerIndex: number, color?: string) => {
        const x = getScatterX(i, canvas, curvePadding)
        const y = (canvas.width - curvePadding * 2 - LEFT_AXIS_EXTRA_PADDING) * (m - minMorton) / (maxMorton - minMorton) + curvePadding + LEFT_AXIS_EXTRA_PADDING
        // Draw point
        ctx.fillStyle = (props.sfcData!.length - i) <= markerIndex ? (color ?? 'black') : 'transparent'
        ctx.beginPath();
        ctx.lineWidth = 0.5
        // noinspection JSSuspiciousNameCombination
        ctx.arc(y, x, Math.floor(MORTON_PIXEL_DIAM / 2), 0, 2 * Math.PI);
        ctx.fill()
        ctx.closePath()
    }

// TODO: Decouple signal/Morton charts
    useEffect(() => {
        if (props.data.length > 0 && canvasRef.current) {
            const minMorton = props.minSFCrange ?? -1
            const maxMorton = props.maxSFCrange ?? -1

            const canvas: HTMLCanvasElement = canvasRef.current!
            // TODO: Dynamic canvas res?
            // @ts-ignore
            canvas.width = Number(getComputedStyle(canvas).width.replace('px', '') * 2)
            // @ts-ignore
            canvas.height = Number(getComputedStyle(canvas).height.replace('px', '') * 2)
            // @ts-ignore
            ctx = canvas.getContext('2d')
            const curvePadding = canvas.height * CURVE_PADDING_FACTOR
            curvePaddingRef.current = curvePadding
            const axisPadding = canvas.height * AXIS_PADDING_FACTOR

            // TODO: Move Morton encoding/logic to App.tsx, make Chart generic
            const columns: number[][] = []
            const markerIndex = props.currentSignalXVal === undefined ? // No play position
                100
                : Math.floor((props.data[0].length - 1) * props.currentSignalXVal / 100)

            const mortonXValues = [...Array(PLOT_NUM_X_VALUES).keys()]
                .map(i => (i * (maxMorton - minMorton) / (PLOT_NUM_X_VALUES - 1) + minMorton).toExponential(1))
            const numTimeSteps = props.numLines ?? props.data[0].length - 1
            const mortonRightYValues = [...Array(PLOT_NUM_Y_VALUES).keys()]
                .map(i => Math.floor(i * numTimeSteps / (PLOT_NUM_Y_VALUES - 1)).toString())
            console.log(mortonRightYValues)
            setMortonRightYValues(mortonRightYValues)

            let lineXValues = [...Array(PLOT_NUM_X_VALUES).keys()].map(i => Math.floor(i * (props.data[0].length - 1) / (PLOT_NUM_X_VALUES - 1)).toString())

            if (props.startTimeXticks !== undefined ) {
                // @ts-ignore
                const step = (props.finishTimeXticks - props.startTimeXticks) / (PLOT_NUM_X_VALUES-1);
                // @ts-ignore
                lineXValues = Array.from({ length: PLOT_NUM_X_VALUES }, (_, i) => Math.round(props.startTimeXticks + i * step).toString());
            }

            const xTickMarks = props.type === 'scatter' ? mortonXValues : lineXValues
            setXTickMarks(xTickMarks)

            const lineYValues = [...Array(PLOT_NUM_Y_VALUES).keys()]
                .map(i => props.minValue + i * (props.maxValue - props.minValue) / (PLOT_NUM_Y_VALUES - 1))
            let leftExtraPadding = LEFT_AXIS_EXTRA_PADDING

            let leftYTickMarks: string[]

            if (props.type === 'scatter') {
                leftYTickMarks = MORTON_PLOT_LEFT_Y_VALUES.map(n => n.toFixed(1))
            } else {
                leftYTickMarks = lineYValues.map(n => n.toFixed(1))
                const longestLabelNum = [...leftYTickMarks].sort((a, b) =>
                    b.length - a.length)[0]
                if (longestLabelNum.length > MAX_Y_AXIS_DIGITS) {
                    leftYTickMarks = lineYValues.map(n => n.toExponential(1))
                    leftExtraPadding = LEFT_AXIS_E_NOTATION_EXTRA_PADDING
                }
            }
            setYTickMarks(leftYTickMarks)

            // Signals chart
            if (props.type == 'line') {
                const data = props.data as unknown as number[][] // Only one file as input in EncodingDemo
                data.forEach((column, i) => {
                    // Draw lines
                    ctx.strokeStyle = props.lineColors![i % props.lineColors!.length]
                    ctx.beginPath()
                    ctx.lineWidth = LINE_WIDTH
                    const smoothedData = props.lineDataSmoothing
                        ? getSmoothedData(column, props.lineDataSmoothing)
                        : column
                    columns.push(smoothedData)
                    smoothedData.forEach((point, i) => {
                        const x = getLineX(i, canvas, curvePadding, leftExtraPadding)
                        const y = getLineY(canvas, curvePadding, point)
                        if (i === 0) {
                            ctx.moveTo(x, y)
                        } else {
                            ctx.lineTo(x, y)
                        }
                    })
                    ctx.stroke()
                })

                // Draw markers
                columns.forEach((column, i) => {
                    const x = getLineX(markerIndex, canvas, curvePadding, leftExtraPadding)
                    const y = getLineY(canvas, curvePadding, column[markerIndex])

                    // Outline + shadow
                    ctx.shadowColor = '#555'
                    ctx.shadowBlur = 6
                    ctx.fillStyle = 'white'
                    ctx.beginPath()
                    ctx.lineWidth = 0.5
                    // noinspection JSSuspiciousNameCombination
                    ctx.arc(x, y, MARKER_RADIUS, 0, 2 * Math.PI);
                    ctx.fill()
                    ctx.closePath()
                    ctx.shadowBlur = 0

                    // Inner circle
                    ctx.fillStyle = props.lineColors![i % props.lineColors!.length]
                    ctx.beginPath();
                    // noinspection JSSuspiciousNameCombination
                    ctx.arc(x, y, MARKER_RADIUS - 3, 0, 2 * Math.PI);
                    ctx.fill()
                    ctx.closePath()
                })
            } else {
                // SFC scatterplot
                props.sfcData!.forEach((m, i) => {
                    if (Array.isArray(m)) {
                        m.forEach(el => drawSfcBar(canvas, curvePadding, el, minMorton, maxMorton, markerIndex, axisPadding, i))
                    } else {
                        drawSfcBar(canvas, curvePadding, m, minMorton, maxMorton, markerIndex, axisPadding)
                    }
                })

                props.sfcData!.forEach((m, i) => {
                    if (Array.isArray(m)) {
                        m.forEach((el, j) =>
                            drawSfcPoint(j, canvas, curvePadding, el, minMorton, maxMorton, markerIndex,
                                props.lineColors ? props.lineColors[i] : 'black'))
                    } else {
                        drawSfcPoint(i, canvas, curvePadding, m, minMorton, maxMorton, markerIndex);
                    }
                })
            }

            // @ts-ignore
            ctx = canvas.getContext('2d')
        }
    }, [canvasRef.current, props.data, props.transformedData, props.maxValue, props.minValue, props.currentSignalXVal, props.scales,
        props.offsets, props.bitsPerSignal, props.sfcData, props.minSFCrange, props.maxSFCrange]);

    return <div className={'chart'} id={props.id ? props.id + '-chart' : ''}>
        <div className={'canvas-container'}>
            <div className={'canvas-wrapper'} id={props.type === 'line' ? 'left-canvas' : 'right-canvas'}>
                <h2 className={'chartitle'}>{props.name}</h2>
                {props.yAxisLabelPos === 'left' && <p className={'y-axis-label'}>{props.yAxisName}</p>}
                <div className={'chartYTicks'}>{
                    Array.from(Array(props.type === 'line' ? PLOT_NUM_Y_VALUES : MORTON_PLOT_LEFT_Y_VALUES.length).keys()).map(i => {
                        return <div key={i} className={'y-tick-mark'}>
                            <span className={'y-tick-mark-label'}>{yTickMarks[i]}</span>
                            <span className={'y-tick-line'}/>
                        </div>})}
                </div>
                <canvas ref={canvasRef} className={props.type} id={props.id ? props.id + '-canvas' : ''}></canvas>
                <div className={'chartXTicks'}>{
                    Array.from(Array(PLOT_NUM_X_VALUES).keys()).map(i => {
                        return <div key={i} className={'x-tick-mark'}>
                            <span className={'x-tick-line'}/>
                            <span className={'x-tick-mark-label'}>{xTickMarks[i]}</span>
                        </div>})}
                </div>
                {props.type === 'line' ? <p className={'chart-x-axis-name'}>{props.xAxisName}</p> : props.encoderSwitch}
                {props.type === 'scatter' && <div className={'chartYTicks'} id={'right-axis'}>{
                    Array.from(Array(PLOT_NUM_Y_VALUES).keys()).map(i => {
                        return <div key={i} className={'y-tick-mark'}>
                            <span className={'y-tick-line'}/>
                            <span className={'y-tick-mark-label'}>{mortonRightYValues[i]}</span>
                        </div>})}
                </div>}
                {props.yAxisLabelPos === 'right' && <p className={'y-axis-label'}>{props.yAxisName}</p>}
                {props.legendLabels && <Legend labels={props.legendLabels} onClick={props.onLegendClick!} lineColors={props.lineColors}/>}
            </div>
        </div>
    </div>;
}