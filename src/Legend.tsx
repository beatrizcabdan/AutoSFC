import './Legend.scss'
import {useState} from "react";

export function Legend(props: { labels: string[], onClick: () => void }) {
    const [showMsg, setShowMsg] = useState(false)
    return <div className={'legend-container'}>
            <p className={`legend-msg ${showMsg ? 'show' : ''}`}>Choose columns...</p>
            <div className={'legend'}
                 onClick={props.onClick}
                 onMouseOver={() => setShowMsg(showMsg => !showMsg)}
                 onMouseOut={() => setShowMsg(showMsg => !showMsg)}>
            {props.labels.map((label, i) => <p key={i}>{label}</p>)}
            </div>
        </div>
}