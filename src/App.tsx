// noinspection TypeScriptValidateTypes

import './App.scss'

import React, {useEffect, useRef} from 'react';
/*import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend, CategoryScale, BarElement,
} from 'chart.js';
import {Bar, Chart} from 'react-chartjs-2';*/

/*ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, CategoryScale, BarElement);

export const options = {
    scales: {
        y: {
            beginAtZero: true,
        },
    },
};*/

const xData = [2, 5, 7, 9, 11, 14]
const yData = [3, 2, 8, 7, 2.5, 6.5]

/*export const data = {
        datasets: [{
            type: 'bar',
            label: 'Bar Dataset',
            data: xData,
            options
        }, {
            type: 'scatter',
            label: 'Line Dataset',
            data: xData.map((x, i) => {
                return {x: x, y: yData[i]}
            }),
        }],
        labels: xData,
    options: options
}*/

function Chart(props: {name: string}) {
    const canvasRef = useRef<HTMLCanvasElement>()
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
        if (canvasRef.current) {
            const canvas = canvasRef.current!
            ctx = canvas.getContext('2d')
            drawAxes(canvas);
        }
    }, [canvasRef]);

    return <div className={'chart'}>
        <canvas ref={canvasRef}>

        </canvas>
        {props.name}
    </div>;
}

function App() {
    return (
      <>
          <Chart name={'Original signals plot'}/>
          <Chart name={'Morton plot (with bars)'}/>
          {/*<div>
              <Chart options={options} data={data} type={'mixed'}/>
          </div>*/}
      </>
  )
}

export default App
