import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './Legend.scss';
import { useState } from "react";
export function Legend(props) {
    const [showMsg, setShowMsg] = useState(false);
    return _jsxs("div", { className: 'legend-container', children: [_jsx("p", { className: `legend-msg ${showMsg ? 'show' : ''}`, children: "Choose columns..." }), _jsx("div", { className: 'legend', onClick: props.onClick, onMouseOver: () => setShowMsg(showMsg => !showMsg), onMouseOut: () => setShowMsg(showMsg => !showMsg), children: props.labels.map((label, i) => _jsx("p", { children: label }, i)) })] });
}
