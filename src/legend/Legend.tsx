import React, {useRef, useState} from 'react';
import './Legend.scss'
import {Tooltip} from "../tooltip/Tooltip.tsx";

export function Legend(props: { labels: string[], onClick: () => void, lineColors: string[] | undefined }) {
    const [showMsg, setShowMsg] = useState(false)
    const toolTipRef= useRef<HTMLDivElement | null>(null)
    return <div className={'legend-container'}>
        <Tooltip msg={'Choose columns...'} showMsg={showMsg} anchorRef={toolTipRef}/>
        <div className={'legend control-container '} ref={toolTipRef}
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
                <p>{label}</p>
            </React.Fragment>)}
        </div>
    </div>
}