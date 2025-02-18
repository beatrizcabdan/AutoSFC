/* eslint-disable @typescript-eslint/ban-ts-comment*/

import {useEffect, useRef} from "react";
import {makeGaussKernel, mortonEncode2D} from "./utils.ts";
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

export function Chart(props: { name: string, data: number[][], type: string, xAxisName: string, yAxisName: string,
    yAxisLabelPos: string, maxValue: number, minValue: number, legendLabels?: string[] | null, currentSignalXVal: number,
    startTimeXticks?: number, finishTimeXticks?: number, lineDataSmoothing?: number, onLegendClick?: () => void}) {
    const PLOT_NUM_Y_VALUES = 8
    const PLOT_NUM_X_VALUES = 9
    const AXIS_PADDING_FACTOR = 0.07
    const CURVE_PADDING_FACTOR = AXIS_PADDING_FACTOR + 0.04
    const LEFT_AXIS_EXTRA_PADDING = 10
    const LINE_CHART_LEFT_AXIS_EXTRA_PADDING = 50
    const MAX_Y_AXIS_DIGITS = 4

    const LINE_WIDTH = 4
    const MARKER_RADIUS = 12
    const MORTON_BAR_WIDTH = 4
    const MORTON_PIXEL_DIAM = 4

    const LINE_COLORS = ['blue', 'orange', 'green']

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const curvePaddingRef = useRef(0)

    //TODO: null ctx is not ok null check todo
    //@ts-ignore
    let ctx: CanvasRenderingContext2D

    function drawAxis(canvas: HTMLCanvasElement, axisPadding: number, position: string, lineWidth: number,
                      tickMarks?: string[], tickPaddingFactor = CURVE_PADDING_FACTOR, leftExtraPadding: number = 10) {
        const ulCorner = {x: axisPadding + leftExtraPadding, y: axisPadding}
        const urCorner = {x: canvas.width - axisPadding, y: axisPadding}
        const blCorner = {x: axisPadding + leftExtraPadding, y: canvas.height - axisPadding}
        const brCorner = {x: canvas.width - axisPadding, y: canvas.height - axisPadding}

        ctx.lineWidth = lineWidth
        const rootElem = document.querySelector('#root');
        const axisColor= rootElem ? getComputedStyle(rootElem).color : 'black'
        ctx.strokeStyle = axisColor

        ctx.beginPath()

        let startPos: {x: number, y: number} = {x: -1, y: -1}
        let endPos: {x: number, y: number} = {x: -1, y: -1}

        switch (position) {
            case 'left': {
                startPos = {x: blCorner.x, y: blCorner.y}
                endPos = {x: ulCorner.x, y: ulCorner.y}
                break
            }
            case 'bottom': {
                startPos = {x: blCorner.x, y: blCorner.y}
                endPos = {x: brCorner.x, y: brCorner.y}
                break
            }
            case 'right': {
                startPos = {x: brCorner.x, y: brCorner.y}
                endPos = {x: urCorner.x, y: urCorner.y}
                break
            }
            case 'top': {
                startPos = {x: ulCorner.x, y: ulCorner.y}
                endPos = {x: urCorner.x, y: urCorner.y}
                break
            }
        }

        ctx.moveTo(startPos.x, startPos.y)
        ctx.lineTo(endPos.x, endPos.y)
        ctx.stroke()

        if (tickMarks) {
            const tickLength = 10
            const tickTextMargin = 20
            let tickStartPos: {x: number, y: number} = {x: -1, y: -1}
            let tickEndPos: {x: number, y: number} = {x: -1, y: -1}
            let textPos: {x: number, y: number} = {x: -1, y: -1}
            const tickPadding = canvas.height * tickPaddingFactor
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = axisColor

            tickMarks.forEach((_, i) => {
                switch (position) {
                    case 'left': {
                        const axisLen = canvas.height - tickPadding * 2
                        const intervalLen = axisLen / (tickMarks.length - 1)
                        tickStartPos = {x: axisPadding + leftExtraPadding, y: canvas.height - tickPadding - intervalLen * i}
                        tickEndPos = {x: tickStartPos.x - tickLength, y: tickStartPos.y}
                        textPos = {x: tickEndPos.x - tickTextMargin, y: tickEndPos.y}
                        break
                    }
                    case 'bottom': {
                        const axisWidth = canvas.width - tickPadding * 2 - leftExtraPadding
                        const intervalLen = axisWidth / (tickMarks.length - 1)
                        tickStartPos = {x: tickPadding + intervalLen * i + leftExtraPadding, y: canvas.height - axisPadding}
                        tickEndPos = {x: tickStartPos.x, y: tickStartPos.y + tickLength}
                        textPos = {x: tickEndPos.x, y: tickEndPos.y + tickTextMargin}
                        break
                    }
                    case 'right': {
                        const axisLen = canvas.height - tickPadding * 2
                        const intervalLen = axisLen / (tickMarks.length - 1)
                        tickStartPos = {x: canvas.width - axisPadding, y: canvas.height - tickPadding - intervalLen * i}
                        tickEndPos = {x: tickStartPos.x + tickLength, y: tickStartPos.y}
                        textPos = {x: tickEndPos.x + tickTextMargin, y: tickEndPos.y}
                        break
                    }
                    case 'top': {}
                }

                ctx.font = '24px sans-serif';
                ctx.fillText(tickMarks[i], textPos.x - (position === 'left' ? leftExtraPadding * 0.5 : 0), textPos.y)

                ctx.lineWidth = 1
                ctx.strokeStyle = axisColor

                ctx.beginPath()
                ctx.moveTo(tickStartPos.x, tickStartPos.y)
                ctx.lineTo(tickEndPos.x, tickEndPos.y)
                ctx.closePath()
                ctx.stroke()
            })
        }
    }

    function getLineX(i: number, canvas: HTMLCanvasElement, padding: number, leftExtraPadding: number) {
        return (i / (props.data[0].length - 1)) * (canvas.width - padding * 2 - leftExtraPadding) + padding + leftExtraPadding;
    }

    function getScatterX(i: number, canvas: HTMLCanvasElement, padding: number) {
        return (i / (props.data[0].length - 1)) * (canvas.height - padding * 2) + padding
    }

    function getLineY(canvas: HTMLCanvasElement, curvePadding: number, point: number) {
        return (canvas.height - curvePadding * 2) * (props.maxValue - point) / (props.maxValue - props.minValue) + curvePadding;
    }

    useEffect(() => {
        if (props.data.length > 0 && canvasRef.current) {
            const mortonData = mortonEncode2D(props.data[0], props.data[1]).reverse()

            const mortonSorted = [...mortonData].sort((a, b) => a - b)
            const minMorton = mortonSorted[0]
            const maxMorton = mortonSorted[mortonSorted.length - 1]

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
            const markerIndex = Math.floor((props.data[0].length - 1) * props.currentSignalXVal / 100)

            const mortonLeftYValues = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
            const mortonXValues = [...Array(PLOT_NUM_X_VALUES).keys()]
                .map(i => (i * (maxMorton - minMorton) / (PLOT_NUM_X_VALUES - 1) + minMorton).toExponential(1))
            const mortonRightYValues = [...Array(PLOT_NUM_Y_VALUES).keys()]
                .map(i => Math.floor(i * (props.data[0].length - 1) / (PLOT_NUM_Y_VALUES - 1)).toString())

            let lineXValues = [...Array(PLOT_NUM_X_VALUES).keys()].map(i => Math.floor(i * (props.data[0].length - 1) / (PLOT_NUM_X_VALUES - 1)).toString())

            if (props.startTimeXticks !== undefined ) {
                // @ts-ignore
                const step = (props.finishTimeXticks - props.startTimeXticks) / (PLOT_NUM_X_VALUES-1);
                // @ts-ignore
                lineXValues = Array.from({ length: PLOT_NUM_X_VALUES }, (_, i) => Math.round(props.startTimeXticks + i * step).toString());
            }

            const xTickMarks = props.type === 'scatter' ? mortonXValues : lineXValues

            const lineYValues = [...Array(PLOT_NUM_Y_VALUES).keys()]
                .map(i => props.minValue + i * (props.maxValue - props.minValue) / (PLOT_NUM_Y_VALUES - 1))

            const leftTickPaddingFactor = props.type === 'line' ? CURVE_PADDING_FACTOR : AXIS_PADDING_FACTOR
            let leftExtraPadding = LEFT_AXIS_EXTRA_PADDING

            let yTickMarks: string[]

            if (props.type === 'scatter') {
                yTickMarks = mortonLeftYValues.map(n => n.toFixed(1))
            } else {
                yTickMarks = lineYValues.map(n => n.toFixed(1))
                const longestLabelNum = [...yTickMarks].sort((a, b) =>
                    b.length - a.length)[0]
                if (longestLabelNum.length > MAX_Y_AXIS_DIGITS) {
                    yTickMarks = lineYValues.map(n => n.toExponential(1))
                    leftExtraPadding = LINE_CHART_LEFT_AXIS_EXTRA_PADDING
                }
            }

            if (props.type == 'line') {
                props.data.forEach((column, i) => {
                    // Draw lines
                    ctx.strokeStyle = LINE_COLORS[i]
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
                    ctx.fillStyle = LINE_COLORS[i]
                    ctx.beginPath();
                    // noinspection JSSuspiciousNameCombination
                    ctx.arc(x, y, MARKER_RADIUS - 3, 0, 2 * Math.PI);
                    ctx.fill()
                    ctx.closePath()
                })
            } else {
                // Morton scatterplot
                // Draw bar
                mortonData.forEach((m) => {
                    const curveCanvasWidth = canvas.width - curvePadding * 2 - LEFT_AXIS_EXTRA_PADDING
                    const y = curveCanvasWidth * (m - minMorton) / (maxMorton - minMorton) + curvePadding + LEFT_AXIS_EXTRA_PADDING

                    const barX = y - MORTON_BAR_WIDTH / 2
                    const signalX = curveCanvasWidth * (mortonData[mortonData.length - 1 - markerIndex] - minMorton)
                        / (maxMorton - minMorton) + curvePadding
                    const currentBarDistance = Math.abs(barX - signalX) / curveCanvasWidth

                    const defaultColor = {r: 204, g: 204, b: 204}
                    const markedColor = {r: 0, g: 150, b: 255}
                    const coloredWidth = 0.03
                    const markedWeight = Math.max(coloredWidth - currentBarDistance, 0) / coloredWidth
                    ctx.fillStyle = `rgb(
                        ${markedColor.r * markedWeight + defaultColor.r * (1 - markedWeight)},
                        ${markedColor.g * markedWeight + defaultColor.g * (1 - markedWeight)},
                        ${markedColor.b * markedWeight + defaultColor.b * (1 - markedWeight)})`
                    ctx.fillRect(barX, axisPadding, MORTON_BAR_WIDTH, canvas.height - 2 * axisPadding)
                })

                // Draw points
                mortonData.forEach((m, i) => {
                    const x = getScatterX(i, canvas, curvePadding)
                    const y = (canvas.width - curvePadding * 2 - LEFT_AXIS_EXTRA_PADDING) * (m - minMorton) / (maxMorton - minMorton) + curvePadding + LEFT_AXIS_EXTRA_PADDING
                        // Draw point
                        ctx.fillStyle = 'black'
                        ctx.beginPath();
                        ctx.lineWidth = 0.5
                        // noinspection JSSuspiciousNameCombination
                        ctx.arc(y, x, Math.floor(MORTON_PIXEL_DIAM / 2), 0, 2 * Math.PI);
                        ctx.fill()
                        ctx.closePath()
                })
            }

            // @ts-ignore
            ctx = canvas.getContext('2d')

            drawAxis(canvas, axisPadding, 'left', 2, yTickMarks, leftTickPaddingFactor, leftExtraPadding)
            drawAxis(canvas, axisPadding, 'bottom', 2, xTickMarks, undefined, leftExtraPadding)
            drawAxis(canvas, axisPadding, 'right', 2, props.type === 'scatter' ? mortonRightYValues : [], CURVE_PADDING_FACTOR, leftExtraPadding)
            drawAxis(canvas, axisPadding, 'top', 2, undefined, undefined, leftExtraPadding)
        }
    }, [canvasRef.current, props.data, props.maxValue, props.minValue, props.currentSignalXVal]);

    return <div className={'chart'}>
        <h2 className={'chartitle'}>{props.name}</h2>

        <div className={'canvas-container'}>
            {props.yAxisLabelPos === 'left' && <p className={'y-axis-label'}>{props.yAxisName}</p>}
            <div className={'canvas-wrapper'}>
                <canvas ref={canvasRef} className={props.type}></canvas>
                <p>{props.xAxisName}</p>
            </div>
            {props.yAxisLabelPos === 'right' && <p className={'y-axis-label'}>{props.yAxisName}</p>}
        </div>
        {props.legendLabels && <Legend labels={props.legendLabels} onClick={props.onLegendClick!}/>}
    </div>;
}