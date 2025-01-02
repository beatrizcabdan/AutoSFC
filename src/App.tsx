// noinspection TypeScriptValidateTypes

import './App.scss'

import React, {FormEvent, useEffect, useState} from 'react';
import {Chart} from "./Chart.tsx";
import {Button} from "./Button.tsx";
import {Slider} from "./Slider.tsx";

const demoPreset1 = {
    dataPointInterval: 1000,
    dataRangeStart: -1,
    dataRangeEnd: -1,
    lineDataSmoothing: 0
}

const demoPreset2 = {
    dataPointInterval: 5,
    dataRangeStart: 13000,
    dataRangeEnd: 14000,
    lineDataSmoothing: 1.0
}

const demoPreset3 = {
    dataPointInterval: 1,
    dataRangeStart: 1000,
    dataRangeEnd: 1020,
    lineDataSmoothing: 0
}

const preset = demoPreset2

function App() {
    const FILE_PATH = 'src/assets/opendlv.device.gps.pos.Grp1Data-0-excerpt.csv'
    const DATA_POINT_INTERVAL  = preset.dataPointInterval
    const SLIDER_START_VAL = 0

    const dataRange: {start: number, end: number} = {start: preset.dataRangeStart, end: preset.dataRangeEnd}
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
                    const column: number[] = lines
                        .slice(1) // Skip headers
                        .slice(dataRange.start >= 0 ? dataRange.start : 0,
                             dataRange.end >= 0 ? dataRange.end : undefined)
                        .map(l => l.split(/;/))
                        .map(arr => Number(arr[index]))
                        .filter((_, i) => i % DATA_POINT_INTERVAL == 0)
                    const sortedData = [...column].sort((a, b) => a - b)
                    minData = Math.min(minData, sortedData[0])
                    maxData = Math.max(maxData, sortedData[sortedData.length - 1])
                    newData.push(column)
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
                         yAxisName={'Acceleration'} yAxisLabelPos={'left'} legendLabels={dataLabels}
                         currentSignalXVal={signalMarkerPos} lineDataSmoothing={preset.lineDataSmoothing}/>
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
