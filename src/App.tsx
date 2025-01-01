// noinspection TypeScriptValidateTypes

import './App.scss'

import React, {useEffect, useState} from 'react';
import {Chart} from "./Chart.tsx";
import {Button} from "./Button.tsx";
import {Slider} from "./Slider.tsx";

function App() {
    const FILE_PATH = 'src/assets/opendlv.device.gps.pos.Grp1Data-0-excerpt.csv'
    const DATA_POINT_INTERVAL  = 1000

    const dataLabels = ['accel_lon', 'accel_trans']
    const [data, setData] = useState<number[][]>([])
    const [minValue, setMinValue] = useState<number>()
    const [maxValue, setMaxValue] = useState<number>()

    useEffect(() => {
        fetch(FILE_PATH).then(r => {
            r.text().then(t => {
                const lines = t
                    .trim()
                    .split(/\n/)
                const colIndices = lines[0]
                    .split(/;/)
                    .reduce((p: number[], c, i): number[] =>  dataLabels.includes(c) ? [...p, i] : p, [])
                const newData: number[][] = []
                let minData = Infinity
                let maxData = 0
                colIndices.forEach(index => {
                    const columns: number[] = lines
                         .slice(1)
                        .map(l => l.split(/;/))
                        .map(arr => Number(arr[index]))
                        .filter((_, i) => i % DATA_POINT_INTERVAL == 0)
                    const sortedData = [...columns].sort((a, b) => a - b)
                    minData = Math.min(minData, sortedData[0])
                    maxData = Math.max(maxData, sortedData[sortedData.length - 1])
                    newData.push(columns)
                })
                setData(newData)
                setMinValue(minData)
                setMaxValue(maxData)
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
              <Chart name={'Original signals plot'} data={data} minValue={minValue} maxValue={maxValue} type={'line'} xAxisName={'Time steps'}
                     yAxisName={'Ground speed (m/s)'} yAxisLabelPos={'left'}/>
              <Chart name={'Morton plot (with bars)'} data={data} minValue={minValue} maxValue={maxValue} type={'scatter'} xAxisName={'Morton'}
                     yAxisName={'Time steps'} yAxisLabelPos={'right'}/>
          </div>
          <Slider min={0} max={data?.length} onDrag={onSliderDrag}/>
          <Button label={'Upload data'} onClick={() => uploadData()}/>
      </>
  )
}

export default App
