import React, {useEffect, useRef} from "react";
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
    yAxisLabelPos: string, maxValue: number, minValue: number, legendLabels?: string[], currentSignalXVal: number,
    lineDataSmoothing?: number, onLegendClick?: () => void}) {
    const PLOT_NUM_Y_VALUES = 8
    const PLOT_NUM_X_VALUES = 9
    const AXIS_PADDING_FACTOR = 0.07
    const CURVE_PADDING_FACTOR = AXIS_PADDING_FACTOR + 0.04

    const LINE_WIDTH = 4
    const MARKER_RADIUS = 12
    const MORTON_BAR_WIDTH = 4
    const MORTON_PIXEL_DIAM = 4

    const LINE_COLORS = ['blue', 'orange']

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const curvePaddingRef = useRef(0)

    let ctx: CanvasRenderingContext2D

    function drawAxis(canvas: HTMLCanvasElement, axisPadding: number, position: string, lineWidth: number,
                      tickMarks?: string[], paddingFactor = CURVE_PADDING_FACTOR) {
        const ulCorner = {x: axisPadding, y: axisPadding}
        const urCorner = {x: canvas.width - axisPadding, y: axisPadding}
        const blCorner = {x: axisPadding, y: canvas.height - axisPadding}
        const brCorner = {x: canvas.width - axisPadding, y: canvas.height - axisPadding}

        ctx.lineWidth = lineWidth
        const rootElem = document.querySelector('#root');
        const axisColor= rootElem ? getComputedStyle(rootElem).color : 'black'
        ctx.strokeStyle = axisColor

        ctx.beginPath()

        let startPos: {x: number, y: number} = {}
        let endPos: {x: number, y: number} = {}

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
            let tickStartPos: {x: number, y: number} = {}
            let tickEndPos: {x: number, y: number} = {}
            let textPos: {x: number, y: number} = {}
            const tickPadding = canvas.height * paddingFactor
            ctx.font = "16px sans-serif"
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = axisColor
            tickMarks.forEach((v, i) => {
                switch (position) {
                    case 'left': {
                        const axisLen = canvas.height - tickPadding * 2
                        const intervalLen = axisLen / (tickMarks.length - 1)
                        tickStartPos = {x: axisPadding, y: canvas.height - tickPadding - intervalLen * i}
                        tickEndPos = {x: tickStartPos.x - tickLength, y: tickStartPos.y}
                        textPos = {x: tickEndPos.x - tickTextMargin, y: tickEndPos.y}
                        break
                    }
                    case 'bottom': {
                        const axisWidth = canvas.width - tickPadding * 2
                        const intervalLen = axisWidth / (tickMarks.length - 1)
                        tickStartPos = {x: tickPadding + intervalLen * i, y: canvas.height - axisPadding}
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

                ctx.fillText(tickMarks[i], textPos.x, textPos.y)

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

    function getLineX(i: number, canvas: HTMLCanvasElement, padding: number) {
        return (i / (props.data[0].length - 1)) * (canvas.width - padding * 2) + padding;
    }

    function getScatterX(i: number, canvas: HTMLCanvasElement, padding: number) {
        return (i / (props.data[0].length - 1)) * (canvas.height - padding * 2) + padding;
    }

    function getLineY(canvas: HTMLCanvasElement, curvePadding: number, point: number) {
        return (canvas.height - curvePadding * 2) * (props.maxValue - point) / (props.maxValue - props.minValue) + curvePadding;
    }

    useEffect(() => {
        // console.log(props.data)

        if (props.data.length > 0 && canvasRef.current) {
            const mortonData = mortonEncode2D(props.data[0], props.data[1], props.minValue)
            const mortonSorted = [...mortonData].sort((a, b) => a - b)
            const minMorton = mortonSorted[0]
            const maxMorton = mortonSorted[mortonSorted.length - 1]

            const canvas: HTMLCanvasElement = canvasRef.current!
            // TODO: Dynamic canvas res?
            canvas.width = Number(getComputedStyle(canvas).width.replace('px', '') * 2)
            canvas.height = Number(getComputedStyle(canvas).height.replace('px', '') * 2)
            ctx = canvas.getContext('2d')
            const curvePadding = canvas.height * CURVE_PADDING_FACTOR
            curvePaddingRef.current = curvePadding
            const axisPadding = canvas.height * AXIS_PADDING_FACTOR

            // TODO: Move Morton encoding/logic to App.tsx, make Chart generic
            let columns: number[][] = []
            const markerIndex = Math.floor((props.data[0].length - 1) * props.currentSignalXVal / 100)

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
                        const x = getLineX(i, canvas, curvePadding)
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
                    const x = getLineX(markerIndex, canvas, curvePadding)
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
                mortonData.forEach((m, i) => {
                    const curveCanvasWidth = canvas.width - curvePadding * 2
                    const y = curveCanvasWidth * (maxMorton - m) / (maxMorton - minMorton) + curvePadding

                    const barX = y - MORTON_BAR_WIDTH / 2
                    const signalX = curveCanvasWidth * (maxMorton - mortonData[mortonData.length - 1 - markerIndex])
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
                    const y = (canvas.width - curvePadding * 2) * (maxMorton - m) / (maxMorton - minMorton) + curvePadding
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

            ctx = canvas.getContext('2d')

            const mortonLeftYValues = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
            const mortonXValues = [...Array(PLOT_NUM_X_VALUES).keys()]
                .map(i => (i * (maxMorton - minMorton) / (PLOT_NUM_X_VALUES - 1) + minMorton).toExponential(1))
            const mortonRightYValues = [...Array(PLOT_NUM_Y_VALUES).keys()]
                .map(i => Math.floor(i * (props.data[0].length - 1) / (PLOT_NUM_Y_VALUES - 1)).toString())

            const lineXValues = [...Array(PLOT_NUM_X_VALUES).keys()]
                .map(i => Math.floor(i * (props.data[0].length - 1) / (PLOT_NUM_X_VALUES - 1)).toString())
            const xTickMarks = props.type === 'scatter' ? mortonXValues : lineXValues

            const lineYValues = [...Array(PLOT_NUM_Y_VALUES).keys()]
                .map(i => props.minValue + i * (props.maxValue - props.minValue) / (PLOT_NUM_Y_VALUES - 1))
            const yTickMarks = props.type === 'scatter' ? mortonLeftYValues : lineYValues

            const leftPaddingFactor = props.type === 'line' ? CURVE_PADDING_FACTOR : AXIS_PADDING_FACTOR

            drawAxis(canvas, axisPadding, 'left', 2, yTickMarks.map(n => n.toFixed(1)), leftPaddingFactor)
            drawAxis(canvas, axisPadding, 'bottom', 2, xTickMarks)
            drawAxis(canvas, axisPadding, 'right', 2, props.type === 'scatter' ? mortonRightYValues : [])
            drawAxis(canvas, axisPadding, 'top', 2)
        }
    }, [canvasRef.current, props.data, props.maxValue, props.minValue, props.currentSignalXVal]);

    return <div className={'chart'}>
        {props.legendLabels && <Legend labels={props.legendLabels} onClick={props.onLegendClick!}/>}
        <div className={'canvas-container'}>
            {props.yAxisLabelPos === 'left' && <p className={'y-axis-label'}>{props.yAxisName}</p>}
            <div className={'canvas-wrapper'}>
                <canvas ref={canvasRef} className={props.type}></canvas>
                <p>{props.xAxisName}</p>
                <h2>{props.name}</h2>
            </div>
            {props.yAxisLabelPos === 'right' && <p className={'y-axis-label'}>{props.yAxisName}</p>}
        </div>
    </div>;
}