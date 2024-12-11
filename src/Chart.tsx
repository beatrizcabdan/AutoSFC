import React, {useEffect, useRef} from "react";
import {mortonEncode2D} from "./tools.ts";

export function Chart(props: { name: string, data: number[], type: string, xAxisName: string, yAxisName: string, yAxisLabelPos: string }) {
    const linePlotNumYValues = 8

    const canvasRef = useRef(null)
    let ctx: CanvasRenderingContext2D

    function drawAxis(canvas: HTMLCanvasElement, padding: number, position: string,
                      tickMarks?: number[], numDecimals?: number) {
        const ulCorner = {x: padding, y: padding / 2}
        const urCorner = {x: canvas.width - padding, y: padding / 2}
        const blCorner = {x: padding, y: canvas.height - padding * 0.7}
        const brCorner = {x: canvas.width - padding, y: canvas.height - padding * 0.7}

        ctx.lineWidth = 2
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
                startPos = {x: urCorner.x, y: urCorner.y}
                endPos = {x: brCorner.x, y: brCorner.y}
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

        if (position && tickMarks) {
            const tickLength = 10
            const tickTextMargin = 20
            let tickStartPos: {x: number, y: number} = {}
            let tickEndPos: {x: number, y: number} = {}
            let textPos: {x: number, y: number} = {}
            ctx.font = "16px sans-serif"
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = axisColor
            tickMarks.forEach((v, i) => {
                switch (position) {
                    case 'left': {
                        const intervalLen = (endPos.y - startPos.y) / (tickMarks.length - 1)
                        tickStartPos = {x: startPos.x, y: startPos.y + intervalLen * i}
                        tickEndPos = {x: tickStartPos.x - tickLength, y: tickStartPos.y}
                        textPos = {x: tickEndPos.x - tickTextMargin, y: tickEndPos.y}
                        break
                    }
                    case 'bottom': {
                        const intervalLen = (endPos.x - startPos.x) / (tickMarks.length - 1)
                        tickStartPos = {x: startPos.x + intervalLen * i, y: startPos.y}
                        tickEndPos = {x: tickStartPos.x, y: tickStartPos.y + tickLength}
                        textPos = {x: tickEndPos.x, y: tickEndPos.y + tickTextMargin}
                        // TODO: Implement
                        break
                    }
                    case 'right': {
                        // TODO: Implement
                        break
                    }
                    case 'top': {
                        // TODO: Implement
                    }
                }

                ctx.fillText(tickMarks[i].toFixed(numDecimals ?? 1), textPos.x, textPos.y)

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

    function getX(i: number, canvas: HTMLCanvasElement, padding: number) {
        return (i / props.data.length) * (canvas.width - padding * 2) + padding;
    }

    useEffect(() => {
        if (props.data?.length > 0 && canvasRef.current) {
            const sortedData = [...props.data].sort()

            const canvas: HTMLCanvasElement = canvasRef.current!
            canvas.width = Number(getComputedStyle(canvas).width.replace('px', '') * 2)
            canvas.height = Number(getComputedStyle(canvas).height.replace('px', '') * 2)
            ctx = canvas.getContext('2d')
            let padding = canvas.height * 0.13

            const minData = sortedData[0]
            const maxData = sortedData[sortedData.length - 1]

            if (props.type == 'line') {
                ctx.strokeStyle = "blue"
                ctx.beginPath()
                ctx.lineWidth = 3
                props.data.forEach((point, i) => {
                    const x = getX(i, canvas, padding)
                    const y = (canvas.height - padding * 2) * (point - minData) / (maxData - minData) + padding
                    if (i === 0) {
                        ctx.moveTo(x, y)
                    } else {
                        ctx.lineTo(x, y)
                    }
                })
                ctx.stroke()
            } else {
                // Morton scatterplot
                // TODO: Move Morton encoding/logic to App.tsx, make Chart generic
                const timeSteps = [...Array(props.data.length).keys()]
                const mortonData = mortonEncode2D(timeSteps, props.data).map(m => Number(m.toString()))
                const mortonSorted = [...mortonData].sort((a, b) => a - b)
                const minMorton = mortonSorted[0]
                const maxMorton = mortonSorted[mortonSorted.length - 1]

                mortonData.forEach((m, i) => {
                    const x = getX(i, canvas, padding)
                    const y = (canvas.width - padding * 2) * (m - minMorton) / (maxMorton - minMorton) + padding

                    ctx.beginPath();
                    ctx.lineWidth = 0.5
                    // noinspection JSSuspiciousNameCombination
                    ctx.arc(y, x, 0.5, 0, 2 * Math.PI);
                    ctx.stroke();
                })
            }

            padding = canvas.height * 0.1
            ctx = canvas.getContext('2d')
            const mortonYValues = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
            const lineYValues = [...Array(linePlotNumYValues).keys()].map(i => i * maxData / linePlotNumYValues)
            const lineXValues = [...Array(9).keys()].map(i => i * props.data.length / 8)
            const yTickMarks = props.type === 'scatter' ? mortonYValues : lineYValues
            const xTickMarks = props.type === 'scatter' ? [] : lineXValues
            const numDecimals = 1
            drawAxis(canvas, padding, 'left', yTickMarks, numDecimals)
            drawAxis(canvas, padding, 'bottom', xTickMarks, 0)
            drawAxis(canvas, padding, 'right')
            drawAxis(canvas, padding, 'top')
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