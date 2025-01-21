import React, {FormEvent, MutableRefObject, useEffect, useRef, useState} from "react";
import './SelectColumnsDialog.scss'

export function SelectColumnsDialog(props: {show: boolean, dataLabelsRef:  MutableRefObject<string[]>,
    setDataLabels: (newLabels: string[]) => void, currentLabels: string[]}) {

    const [labelsToCheckedMap, setLabelsToCheckedMap]: Map<string, boolean> = useState(new Map())

    useEffect(() => {
        if (props.dataLabelsRef.current && props.currentLabels) {
            const map = new Map<string, boolean>()
            props.dataLabelsRef.current.forEach(l => {
                map.set(l, props.currentLabels.includes(l))
            })
            setLabelsToCheckedMap(map)
        }
    }, [props.dataLabelsRef.current, props.currentLabels])
    
    function onSubmit() {
        const newLabels: string[] = [...labelsToCheckedMap.entries()].filter(e => e[1]).map(a => a[0])
        props.setDataLabels(newLabels)
    }

    function onFormChange(label: string, checked: boolean) {
        const map = new Map<string, boolean>([...labelsToCheckedMap])
        map.set(label, checked)
        setLabelsToCheckedMap(map)
    }

    return <div className={`light-box ${props.show ? 'show' : ''}`}>
            <dialog open={props.show} className={'dialog'}>
                <h2>Select displayed data</h2>
                <form method="dialog" onSubmit={onSubmit}>
                    <div className={'checkbox-list'}>
                    {props.dataLabelsRef.current.map((label, i) => {
                        const id = `checkbox${String(i)}`
                        return <div key={i}>
                            <input type="checkbox" name="state_name" value="Connecticut" id={id}
                                   checked={labelsToCheckedMap.get(label) ?? false} onChange={e => onFormChange(label, e.currentTarget.checked)}/>
                            <label htmlFor={id}>{label}</label>
                        </div>
                    })}
                    </div>
                    <div className={'buttons'}>
                        <button className={'ok-button button'}>OK</button>
                        <button className={'button'}>Cancel</button>
                    </div>
                </form>
            </dialog>;
    </div>
}