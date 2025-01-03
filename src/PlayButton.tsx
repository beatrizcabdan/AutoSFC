import {PlayStatus} from "./App.tsx";
import './PlayButton.scss'

export function PlayButton(props: { onClick: () => void, status: PlayStatus }) {
    const statusToIconMap = new Map<PlayStatus, string>([
        [PlayStatus.PAUSED, 'play_arrow'],
        [PlayStatus.PLAYING, 'pause'],
        [PlayStatus.REACHED_END, 'replay']
    ])

    return <button className={'play-button'} onClick={props.onClick}>
        <span className="material-symbols-outlined">{statusToIconMap.get(props.status)}</span>
    </button>;
}