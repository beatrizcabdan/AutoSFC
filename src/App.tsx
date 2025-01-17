// noinspection TypeScriptValidateTypes

import './App.scss'

import React, {FormEvent, useEffect, useRef, useState} from 'react';
import {Chart} from "./Chart.tsx";
import {Slider} from "./Slider.tsx";
import {PlayButton} from "./PlayButton.tsx";

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
    dataPointInterval: 5,
    dataRangeStart: 63000,
    dataRangeEnd: 64000,
    lineDataSmoothing: 1.0
}

const demoPreset4 = {
    dataPointInterval: 1,
    dataRangeStart: 1000,
    dataRangeEnd: 1020,
    lineDataSmoothing: 0
}

const paperPreset = {
    dataPointInterval: 1,
    dataRangeStart: 720,
    dataRangeEnd: 880,
    lineDataSmoothing: 0
}

const preset = demoPreset2

export enum PlayStatus {
    PLAYING, PAUSED, REACHED_END
}

function App() {
    const FILE_PATH = 'src/assets/opendlv.device.gps.pos.Grp1Data-0-excerpt.csv'
    const DATA_POINT_INTERVAL  = preset.dataPointInterval
    const SLIDER_START_VAL = 0

    const dataRange: {start: number, end: number} = {start: preset.dataRangeStart, end: preset.dataRangeEnd}
    const dataLabels = ['accel_trans', 'accel_down']

    const [data, setData] = useState<number[][]>([])
    const [minChartValue, setMinChartValue] = useState<number>()
    const [maxChartValue, setMaxChartValue] = useState<number>()
    const [signalMarkerPos, setSignalMarkerPos] = useState<number>(SLIDER_START_VAL)
    const [playStatus, setPlayStatus] = useState(PlayStatus.PAUSED)
    const playbackIntervalRef = useRef(-1)

    useEffect(() => {
        fetch(FILE_PATH).then(r => {
            r.text().then(t => {
                const lines = t
                    .trim()
                    .split(/\n/)
                const colIndices = dataLabels.map(label => lines[0]
                    .split(/;/)
                    .findIndex(col => col === label)
                ).filter(index => index !== -1);
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

    const onSliderDrag = (e: FormEvent<HTMLInputElement>) => {
        if (playStatus === PlayStatus.PLAYING) {
            clearInterval(playbackIntervalRef.current)
            setPlayStatus(PlayStatus.PAUSED)
        } else {
            setPlayStatus(e.currentTarget.value >= 100 ? PlayStatus.REACHED_END : PlayStatus.PAUSED)
        }
        setSignalMarkerPos(e.currentTarget.value)
    }

    // Stop playback when reaching end
    useEffect(() => {
        if (playStatus === PlayStatus.PLAYING && signalMarkerPos >= 100) {
            clearInterval(playbackIntervalRef.current)
            setSignalMarkerPos(100)
            setPlayStatus(PlayStatus.REACHED_END)
        }
    }, [signalMarkerPos])

    // Clear interval when unmounting the component
    useEffect(() => {
        return () => clearInterval(playbackIntervalRef.current);
    }, []);

    function startPlayback() {
        playbackIntervalRef.current = setInterval(() => {
                setSignalMarkerPos((signalMarkerPos) => Number(signalMarkerPos) + 0.1)
            },
            20)
    }

    const onPlayClick = () => {
        switch (playStatus) {
            case PlayStatus.PAUSED:
                setPlayStatus(PlayStatus.PLAYING)
                startPlayback();
                break
            case PlayStatus.PLAYING:
                setPlayStatus(PlayStatus.PAUSED)
                clearInterval(playbackIntervalRef.current)
                break
            case PlayStatus.REACHED_END:
                setPlayStatus(PlayStatus.PLAYING)
                setSignalMarkerPos(0)
                startPlayback()
        }
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
                  <Chart name={'Original signals plot'} data={data} minValue={minChartValue} maxValue={maxChartValue}
                         type={'line'} xAxisName={'Time steps'}
                         yAxisName={'Acceleration'} yAxisLabelPos={'left'} legendLabels={dataLabels}
                         currentSignalXVal={signalMarkerPos} lineDataSmoothing={preset.lineDataSmoothing}/>
                  <Chart name={'Morton plot (with bars)'} data={data} minValue={minChartValue} maxValue={maxChartValue}
                         type={'scatter'} xAxisName={'Morton'}
                         yAxisName={'Time steps'} yAxisLabelPos={'right'} currentSignalXVal={signalMarkerPos}/>
              </div>
              <div className={'play-controls'}>
                  <PlayButton onClick={onPlayClick} status={playStatus}/>
                  <Slider min={0} max={data?.length} onDrag={onSliderDrag} value={signalMarkerPos}/>
              </div>
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
