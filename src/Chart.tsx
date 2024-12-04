import React, {useEffect, useRef} from "react";

export function Chart(props: { name: string, data: number[], type: string }) {
    const canvasRef = useRef(null)
    let ctx: CanvasRenderingContext2D

    function drawAxes(canvas: HTMLCanvasElement) {
        ctx.lineWidth = 4

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

            if (props.type == 'line') {
                const minSpeed = sortedData[0]
                const maxSpeed = sortedData[sortedData.length - 1]
                const xOffset = canvas.width * 0.1
                const yOffset = canvas.height * 0.1

                ctx.beginPath()
                ctx.lineWidth = 1
                props.data.forEach((point, i) => {
                    const x = (i / props.data.length) * canvas.width
                    const y = canvas.height * (point - minSpeed) / (maxSpeed - minSpeed)
                    if (i === 0) {
                        ctx.moveTo(x, y)
                    } else {
                        ctx.lineTo(x, y)
                    }
                })
                ctx.stroke()
            }
        }
    }, [props.data, canvasRef]);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas: HTMLCanvasElement = canvasRef.current!
            ctx = canvas.getContext('2d')
            drawAxes(canvas);
        }
    }, [canvasRef]);

    return <div className={'chart'}>
        <canvas ref={canvasRef}></canvas>
        {props.name}
    </div>;
}