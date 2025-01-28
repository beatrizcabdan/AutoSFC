import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import './SelectColumnsDialog.scss';
export function SelectColumnsDialog(props) {
    const [submittable, setSubmittable] = useState(true);
    const [labelsToCheckedMap, setLabelsToCheckedMap] = useState(new Map());
    function init() {
        const map = new Map();
        props.dataLabelsRef.current.forEach(l => {
            map.set(l, props.currentLabels.includes(l));
        });
        setLabelsToCheckedMap(map);
        setSubmittable(true);
    }
    useEffect(() => {
        if (props.dataLabelsRef.current && props.currentLabels) {
            init();
        }
    }, [props.dataLabelsRef.current, props.currentLabels]);
    function onSubmit(e) {
        if (!submittable) {
            e.preventDefault();
            return;
        }
        const newLabels = [...labelsToCheckedMap.entries()].filter(e => e[1]).map(a => a[0]);
        props.setDataLabels(newLabels);
    }
    function onFormChange(label, checked) {
        const map = new Map([...labelsToCheckedMap]);
        map.set(label, checked);
        const numChecked = [...map.values()]
            .filter(b => b)
            .length;
        setSubmittable(numChecked === 2);
        setLabelsToCheckedMap(map);
    }
    function onCancel() {
        init();
        props.setShow(false);
    }
    return _jsxs("div", { className: `light-box ${props.show ? 'show' : ''}`, children: [_jsxs("dialog", { open: props.show, className: 'dialog', children: [_jsx("h2", { children: "Select displayed data (two series)" }), _jsxs("form", { method: "dialog", onSubmit: onSubmit, children: [_jsx("div", { className: 'checkbox-list', children: props.dataLabelsRef.current.map((label, i) => {
                                    const id = `checkbox${String(i)}`;
                                    return _jsxs("div", { children: [_jsx("input", { type: "checkbox", name: "state_name", value: "Connecticut", id: id, checked: labelsToCheckedMap.get(label) ?? false, onChange: e => onFormChange(label, e.currentTarget.checked) }), _jsx("label", { htmlFor: id, children: label })] }, i);
                                }) }), _jsxs("div", { className: 'buttons', children: [_jsx("button", { className: `ok-button button ${submittable ? 'enabled' : 'disabled'}`, disabled: !submittable, children: "OK" }), _jsx("button", { onClick: onCancel, className: 'button', children: "Cancel" })] })] })] }), ";"] });
}
