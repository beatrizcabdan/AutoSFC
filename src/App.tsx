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
              <Chart name={'Original signals plot'} data={data} type={'line'} xAxisName={'Time steps'} yAxisName={'Velocity (m/s)'} yAxisLabelPos={'left'}/>
              <Chart name={'Morton plot (with bars)'} data={data} type={'scatter'} xAxisName={'Morton'} yAxisName={'Time steps'} yAxisLabelPos={'right'}/>
          </div>
          <Slider min={0} max={data?.length} onDrag={onSliderDrag}/>
          <Button label={'Upload data'} onClick={() => uploadData()}/>
      </>
  )
}

export default App
