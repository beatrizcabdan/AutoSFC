import './App.css'

import React from 'react';
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

export const options = {
    scales: {
        y: {
            beginAtZero: true,
        },
    },
};

export const data = {
    datasets: [
        {
            label: 'A dataset',
            data: [{
                x: 10,
                y: 20
            }, {
                x: 15,
                y: 10
            }, {
                x: 18,
                y: 14
                },
            ],
            backgroundColor: 'rgba(255, 99, 132, 1)',

        },
    ],
};

function App() {
  return (
      <>
          <div>
              <Scatter options={options} data={data} />
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
