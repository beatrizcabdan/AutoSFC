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

export const data = {
        datasets: [{
            type: 'bar',
            label: 'Bar Dataset',
            data: [10, 20, 30, 40]
        }, {
            type: 'line',
            label: 'Line Dataset',
            data: [50, 50, 50, 50],
        }],
        labels: ['January', 'February', 'March', 'April'],
    options: options
}

function App() {
  return (
      <>
          <div>
              <Chart options={options} data={data} type={'mixed'}/>
          </div>
          <div>
              Original signals plot
          </div>
          <div>
              Morton plot (with bars)
          </div>
      </>
  )
}

export default App
