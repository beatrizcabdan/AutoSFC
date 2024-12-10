import React, {useEffect, useRef} from "react";

function mortonEncode2D(xData: number[], yData: number[]) {
    const resultArr: number[] = []
    xData.forEach((x, i) => {
        let xn = BigInt(x)
        xn = (xn | (xn << 16n)) & 0x0000FFFF0000FFFFn
        xn = (xn | (xn << 8n)) & 0x00FF00FF00FF00FFn
        xn = (xn | (xn << 4n)) & 0x0F0F0F0F0F0F0F0Fn
        xn = (xn | (xn << 2n)) & 0x3333333333333333n
        xn = (xn | (xn << 1n)) & 0x5555555555555555n

        let yn = BigInt(Math.round(yData[i] * 10000))
        yn = (yn | (yn << 16n)) & 0x0000FFFF0000FFFFn
        yn = (yn | (yn << 8n)) & 0x00FF00FF00FF00FFn
        yn = (yn | (yn << 4n)) & 0x0F0F0F0F0F0F0F0Fn
        yn = (yn | (yn << 2n)) & 0x3333333333333333n
        yn = (yn | (yn << 1n)) & 0x5555555555555555n

        const result = xn | (yn << 1n)
        resultArr.push(Number(result))
    })
    return resultArr
}

export function Chart(props: { name: string, data: number[], type: string, xAxisName: string, yAxisName: string }) {
    const canvasRef = useRef(null)
    let ctx: CanvasRenderingContext2D

    function drawAxes(canvas: HTMLCanvasElement) {
        ctx.lineWidth = 5

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

    function getX(i: number, canvas: HTMLCanvasElement, padding: number) {
        return (i / props.data.length) * (canvas.width - padding * 2) + padding;
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
                ctx.lineWidth = 3
                props.data.forEach((point, i) => {
                    const x = getX(i, canvas, padding)
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
                const timeSteps = [...Array(props.data.length).keys()]
                const mortonData = mortonEncode2D(timeSteps, props.data).map(m => Number(m.toString()))
                console.log(mortonData)
                const mortonSorted = [...mortonData].sort((a, b) => a - b)
                const minMorton = mortonSorted[0] /*30*/
                const maxMorton = mortonSorted[mortonSorted.length - 1] /*86000*/

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
        }
    }, [props.data, canvasRef.current]);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas: HTMLCanvasElement = canvasRef.current!
            canvas.width = Number(getComputedStyle(canvas).width.replace('px', '') * 2)
            canvas.height = Number(getComputedStyle(canvas).height.replace('px', '') * 2)
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