// noinspection TypeScriptValidateTypes

import './App.scss'

import React, {useEffect, useState} from 'react';
import {Chart} from "./Chart.tsx";
import {Button} from "./Button.tsx";
import {Slider} from "./Slider.tsx";

function App() {
    const [data, setData] = useState<number[]>()

    useEffect(() => {
        fetch('src/assets/example-data.csv').then(r => {
            r.text().then(t => {
                const lines = t
                    .split(/\n/)
                    .slice(1)
                // @ts-ignore
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
          <div className="topnav">
              <a className="active" href="#demo">Demo</a>
              <a href="#work">Previous work</a>
              <a href="#contact">Contact</a>
              <a href="#about">About SFCs</a>
          </div>
          <div className={'charts'}>
              <Chart name={'Original signals plot'} data={data} type={'line'} xAxisName={'Time steps'}
                     yAxisName={'Ground speed (m/s)'} yAxisLabelPos={'left'}/>
              <Chart name={'Morton plot (with bars)'} data={data} type={'scatter'} xAxisName={'Morton'}
                     yAxisName={'Time steps'} yAxisLabelPos={'right'}/>
          </div>
          <Slider min={0} max={data?.length} onDrag={onSliderDrag}/>
          <Button label={'Upload data'} onClick={() => uploadData()}/>
          <div className="footer">
            Demo of SFCs for encoding multiple dimensions as one by Anton and Bea.
            This is for Christian to check and rejoice.
            More to come.
          </div>
      </>
  )
}

export default App
