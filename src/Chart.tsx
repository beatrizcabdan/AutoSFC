import React, {useEffect, useRef} from "react";
import {ZCurve} from "@thi.ng/morton";

function mortonEncode2D(xData: number[], yData: number[]) {
    // noinspection TypeScriptValidateTypes
    const z = new ZCurve(2, 32);
    return xData.map((x, i) => {
        const m = z.encode([x, yData[i]])
        // console.log(m.toString())
        return m
    })
}

export function Chart(props: { name: string, data: number[], type: string, xAxisName: string, yAxisName: string }) {
    const canvasRef = useRef(null)
    let ctx: CanvasRenderingContext2D

    function drawAxes(canvas: HTMLCanvasElement) {
        ctx.lineWidth = 3

        ctx.strokeStyle = 'black'

        ctx.beginPath()
        ctx.moveTo(0, canvas.height)
        ctx.lineTo(canvas.width, canvas.height)
        ctx.closePath()
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, canvas.height)
        ctx.lineTo(0, 0)
        ctx.closePath()
        ctx.stroke()
    }

    useEffect(() => {
        if (props.data && canvasRef.current) {
            const sortedData = [...props.data].sort()

            const canvas: HTMLCanvasElement = canvasRef.current!
            ctx = canvas.getContext('2d')
            const padding = canvas.height * 0.05

            if (props.type == 'line') {
                const minSpeed = sortedData[0]
                const maxSpeed = sortedData[sortedData.length - 1]

                ctx.strokeStyle = "blue"
                ctx.beginPath()
                ctx.lineWidth = 1.5
                props.data.forEach((point, i) => {
                    const x = (i / props.data.length) * (canvas.width - padding * 2) + padding
                    const y = (canvas.height - padding * 2) * (point - minSpeed) / (maxSpeed - minSpeed) + padding
                    if (i === 0) {
                        ctx.moveTo(x, y)
                    } else {
                        ctx.lineTo(x, y)
                    }
                })
                ctx.stroke()
            } else {
                // Morton scatterplot
                const xData = [...Array(props.data.length).keys()]
                const data = mortonEncode2D(xData, props.data)
            }
        }
    }, [props.data, canvasRef]);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas: HTMLCanvasElement = canvasRef.current!
            canvas.width = Number(getComputedStyle(canvas).width.replace('px', ''))
            canvas.height = Number(getComputedStyle(canvas).height.replace('px', ''))
            ctx = canvas.getContext('2d')
            drawAxes(canvas);
        }
    }, [canvasRef]);

    return <div className={'chart'}>
        <div className={'canvas-container'}>
            <p className={'y-axis-label'}>{props.yAxisName}</p>
            <div className={'canvas-wrapper'}>
                <canvas ref={canvasRef}></canvas>
                <p>{props.xAxisName}</p>
            </div>
        </div>
        {props.name}
    </div>;
}