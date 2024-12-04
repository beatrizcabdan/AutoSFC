// noinspection TypeScriptValidateTypes

import './App.scss'

import React, {useEffect, useState} from 'react';
import {Chart} from "./Chart.tsx";
import {Button} from "./Button.tsx";
import {Slider} from "./Slider.tsx";
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

/*const xData = [2, 5, 7, 9, 11, 14]
const yData = [3, 2, 8, 7, 2.5, 6.5]*/

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

function App() {
    const [data, setData] = useState<number[]>()

    useEffect(() => {
        fetch('src/assets/example-data.csv').then(r => {
            r.text().then(t => {
                const lines = t
                    .split(/\n/)
                    .slice(1)
                const speeds = lines.map(l => l
                    .split(/;/)
                    .slice(0, -1)
                    .reduce((_, c, i, arr) => {
                        if (i == arr.length - 1) {
                            return Number(c)
                        }
                    }))
                setData(speeds)
            })
        })
    }, []);

    function uploadData() {

    }

    const onSliderDrag = () => {

    }

    return (
      <>
          <div className={'charts'}>
              <Chart name={'Original signals plot'} data={data} type={'line'}/>
              <Chart name={'Morton plot (with bars)'} data={[]} type={'scatter'}/>
          </div>
          <Slider min={0} max={data?.length} onDrag={onSliderDrag}/>
          <Button label={'Upload data'} onClick={() => uploadData()}/>
          {/*<div>
              <Chart options={options} data={data} type={'mixed'}/>
          </div>*/}
      </>
  )
}

export default App
