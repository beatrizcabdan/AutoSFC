import { jsx as _jsx } from "react/jsx-runtime";
import { PlayStatus } from "./App.tsx";
import './PlayButton.scss';
export function PlayButton(props) {
    const statusToIconMap = new Map([
        [PlayStatus.PAUSED, 'play_arrow'],
        [PlayStatus.PLAYING, 'pause'],
        [PlayStatus.REACHED_END, 'replay']
    ]);
    return _jsx("button", { className: 'play-button', onClick: props.onClick, children: _jsx("span", { className: "material-symbols-outlined", children: statusToIconMap.get(props.status) }) });
}
