// noinspection TypeScriptValidateTypes

import './App.scss'

import React, {FormEvent, useEffect, useState} from 'react';
import {Chart} from "./Chart.tsx";
import {Button} from "./Button.tsx";
import {Slider} from "./Slider.tsx";

function App() {
    const FILE_PATH = 'src/assets/opendlv.device.gps.pos.Grp1Data-0-excerpt.csv'
    const DATA_POINT_INTERVAL  = 1000
    const SLIDER_START_VAL = 0

    const dataRange: {start: number, end: number} = {start: -1, end: -1}
    const dataLabels = ['accel_lon', 'accel_trans']
    const [data, setData] = useState<number[][]>([])
    const [minChartValue, setMinChartValue] = useState<number>()
    const [maxChartValue, setMaxChartValue] = useState<number>()
    const [signalMarkerPos, setSignalMarkerPos] = useState(SLIDER_START_VAL)

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
                         .slice(1 + (dataRange.start >= 0 ? dataRange.start : 0),
                             dataRange.end >= 0 ? dataRange.end : undefined)
                        .map(l => l.split(/;/))
                        .map(arr => Number(arr[index]))
                        .filter((_, i) => i % DATA_POINT_INTERVAL == 0)
                    const sortedData = [...columns].sort((a, b) => a - b)
                    minData = Math.min(minData, sortedData[0])
                    maxData = Math.max(maxData, sortedData[sortedData.length - 1])
                    newData.push(columns)
                })
                setData(newData)
                setMinChartValue(minData)
                setMaxChartValue(maxData)
            })
        })
    }, []);

    function uploadData() {

    }

    const onSliderDrag = (e: FormEvent<HTMLInputElement>) => {
        setSignalMarkerPos(e.currentTarget.value)
    }

    return (
      <>
          <div className="topnav">
              <a className="active" href="#demo">Demo</a>
              <a href="#work">Previous work</a>
              <a href="#contact">Contact</a>
              <a href="#about">About SFCs</a>
          </div>
          <div id={'main'}>
              <div className={'charts'}>
                  <Chart name={'Original signals plot'} data={data} minValue={minChartValue} maxValue={maxChartValue} type={'line'} xAxisName={'Time steps'}
                         yAxisName={'Acceleration'} yAxisLabelPos={'left'} legendLabels={dataLabels} currentSignalXVal={signalMarkerPos}/>
                  <Chart name={'Morton plot (with bars)'} data={data} minValue={minChartValue} maxValue={maxChartValue} type={'scatter'} xAxisName={'Morton'}
                         yAxisName={'Time steps'} yAxisLabelPos={'right'}/>
              </div>
              <Slider min={0} max={data?.length} onDrag={onSliderDrag} initialVal={SLIDER_START_VAL}/>
              <Button label={'Upload data'} onClick={() => uploadData()}/>
          </div>
          <div className="footer">
            Demo of SFCs for encoding multiple dimensions as one by Anton and Bea.
            This is for Christian to check and rejoice.
            More to come.
          </div>
      </>
  )
}

export default App
