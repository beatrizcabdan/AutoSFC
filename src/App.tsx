// noinspection TypeScriptValidateTypes

import './App.css'

import React from 'react';
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend, CategoryScale, BarElement,
} from 'chart.js';
import {Bar, Chart} from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, CategoryScale, BarElement);

export const options = {
    scales: {
        y: {
            beginAtZero: true,
        },
    },
};

const xData = [2, 5, 7, 9, 11, 14]
const yData = [3, 2, 8, 7, 2.5, 6.5]

export const data = {
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
}

function App() {
  return (
      <>
          <div>
              Original signals plot
          </div>
          <div>
              <Chart options={options} data={data} type={'mixed'}/>
              Morton plot (with bars)
          </div>
      </>
  )
}

export default App
