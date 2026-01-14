import React from 'react';
import './Legend.scss'
import {useState} from "react";

export function Legend(props: { labels: string[], onClick: () => void, lineColors: string[] | undefined }) {
    const [showMsg, setShowMsg] = useState(false)
    return <div className={'legend-container'}>
            <p className={`legend-msg ${showMsg ? 'show' : ''}`}>Choose columns...</p>
            <div className={'legend control-container '}
                 onClick={props.onClick}
                 onMouseOver={() => setShowMsg(showMsg => !showMsg)}
                 onMouseOut={() => setShowMsg(showMsg => !showMsg)}>
            {props.labels.map((label, i) => <React.Fragment key={i}>
                <div style={{
                    content: ' ',
                    width: '2rem',
                    height: '4px',
                    background: `${props.lineColors![i % props.lineColors!.length]}`
                }}></div>
                <p >{label}</p>
            </React.Fragment>)}
            </div>
        </div>
}