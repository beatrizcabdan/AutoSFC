import { jsx as _jsx } from "react/jsx-runtime";
export function Slider(props) {
    return _jsx("input", { className: 'slider', step: 0.01, type: 'range', value: props.value, onInput: e => props.onDrag(e) });
}
