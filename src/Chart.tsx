import React, {useEffect, useRef} from "react";
import {mortonEncode2D,  makeGaussKernel} from "./utils.ts";

const LINE_DATA_SMOOTHING = 2.3

function getSmoothedData(data: number[]) {
    const smoothedArr: number[] = []
    const kernel = makeGaussKernel(LINE_DATA_SMOOTHING)
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

export function Chart(props: { name: string, data: number[], type: string, xAxisName: string, yAxisName: string, yAxisLabelPos: string }) {
    const PLOT_NUM_Y_VALUES = 8
    const PLOT_NUM_X_VALUES = 9
    const AXIS_PADDING_FACTOR = 0.07
    const CURVE_PADDING_FACTOR = AXIS_PADDING_FACTOR + 0.02

    const canvasRef = useRef(null)
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
        return (i / props.data.length) * (canvas.width - padding * 2) + padding;
    }

    function getScatterX(i: number, canvas: HTMLCanvasElement, padding: number) {
        return (i / props.data.length) * (canvas.height - padding * 2) + padding;
    }

    useEffect(() => {
        if (props.data?.length > 0 && canvasRef.current) {
            const sortedData = [...props.data].sort()

            const canvas: HTMLCanvasElement = canvasRef.current!
            // TODO: Dynamic canvas res?
            canvas.width = Number(getComputedStyle(canvas).width.replace('px', '') * 2)
            canvas.height = Number(getComputedStyle(canvas).height.replace('px', '') * 2)
            ctx = canvas.getContext('2d')
            const curvePadding = canvas.height * CURVE_PADDING_FACTOR
            const axisPadding = canvas.height * AXIS_PADDING_FACTOR

            const minData = sortedData[0]
            const maxData = sortedData[sortedData.length - 1]

            // TODO: Move Morton encoding/logic to App.tsx, make Chart generic
            const timeSteps = [...Array(props.data.length).keys()]
            const mortonData = mortonEncode2D(timeSteps, props.data)
            const mortonSorted = [...mortonData].sort((a, b) => a - b)
            const minMorton = mortonSorted[0]
            const maxMorton = mortonSorted[mortonSorted.length - 1]

            if (props.type == 'line') {
                ctx.strokeStyle = "blue"
                ctx.beginPath()
                ctx.lineWidth = 3
                const smoothedData = LINE_DATA_SMOOTHING > 0 ? getSmoothedData(props.data) : props.data
                smoothedData.forEach((point, i) => {
                    const x = getLineX(i, canvas, curvePadding)
                    const y = (canvas.height - curvePadding * 2) * (point - minData) / (maxData - minData) + curvePadding
                    if (i === 0) {
                        ctx.moveTo(x, y)
                    } else {
                        ctx.lineTo(x, y)
                    }
                })
                ctx.stroke()
            } else {
                // Morton scatterplot
                mortonData.forEach((m, i) => {
                    const x = getScatterX(i, canvas, curvePadding)
                    const y = (canvas.width - curvePadding * 2) * (m - minMorton) / (maxMorton - minMorton) + curvePadding

                    ctx.beginPath();
                    ctx.lineWidth = 0.5
                    // noinspection JSSuspiciousNameCombination
                    ctx.arc(y, x, 1, 0, 2 * Math.PI);
                    ctx.fill()
                })
            }

            ctx = canvas.getContext('2d')
            const mortonLeftYValues = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
            const mortonXValues = [...Array(PLOT_NUM_X_VALUES).keys()]
                .map(i => (i * (maxMorton - minMorton) / (PLOT_NUM_X_VALUES - 1) + minMorton).toExponential(1))
            const mortonRightYValues = [...Array(PLOT_NUM_Y_VALUES).keys()]
                .map(i => Math.floor(i * props.data.length / (PLOT_NUM_Y_VALUES - 1)).toString())
            const lineYValues = [...Array(PLOT_NUM_Y_VALUES).keys()].map(i => i * maxData / PLOT_NUM_Y_VALUES)
            const lineXValues = [...Array(PLOT_NUM_X_VALUES).keys()]
                .map(i => Math.floor(i * props.data.length / (PLOT_NUM_X_VALUES - 1)).toString())
            const yTickMarks = props.type === 'scatter' ? mortonLeftYValues : lineYValues
            const xTickMarks = props.type === 'scatter' ? mortonXValues : lineXValues
            const leftPaddingFactor = props.type === 'line' ? CURVE_PADDING_FACTOR : AXIS_PADDING_FACTOR

            drawAxis(canvas, axisPadding, 'left', 2, yTickMarks.map(n => n.toFixed(1)), leftPaddingFactor)
            drawAxis(canvas, axisPadding, 'bottom', 2, xTickMarks)
            drawAxis(canvas, axisPadding, 'right', 2, props.type === 'scatter' ? mortonRightYValues : [])
            drawAxis(canvas, axisPadding, 'top', 2)
        }
    }, [canvasRef.current, props.data]);

    return <div className={'chart'}>
        <div className={'canvas-container'}>
            {props.yAxisLabelPos === 'left' && <p className={'y-axis-label'}>{props.yAxisName}</p>}
            <div className={'canvas-wrapper'}>
                <canvas ref={canvasRef} className={props.type}></canvas>
                <p>{props.xAxisName}</p>
            </div>
            {props.yAxisLabelPos === 'right' && <p className={'y-axis-label'}>{props.yAxisName}</p>}
        </div>
        <h2>{props.name}</h2>
    </div>;
}