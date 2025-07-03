import React, {Dispatch, FormEvent, SetStateAction, useEffect, useState} from "react";
import './SelectColumnsDialog.scss'

export function SelectColumnsDialog(props: {
    show: boolean,
    setShow: Dispatch<SetStateAction<boolean>>,
    allDataLabels: string[],
    setDataLabels: (newLabels: string[]) => void,
    currentLabels: string[] | null,
}) {
    const [submittable, setSubmittable] = useState(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [labelsToCheckedMap, setLabelsToCheckedMap]: [Map<any, any>, Dispatch<SetStateAction<Map<any, any>>>] = useState(new Map())

    function init() {
        const map = new Map<string, boolean>()
        props.allDataLabels.forEach(l => {
            map.set(l, props.currentLabels!.includes(l))
        })
        setLabelsToCheckedMap(map)
        setSubmittable(true)
    }

    useEffect(() => {
        if (props.allDataLabels && props.currentLabels) {
            init();
        }
    }, [props.allDataLabels, props.currentLabels])
    
    function onSubmit(e: FormEvent) {
        if (!submittable) {
            e.preventDefault()
            return
        }
        const newLabels: string[] = [...labelsToCheckedMap.entries()].filter(e => e[1]).map(a => a[0])
        props.setDataLabels(newLabels)
    }

    function onFormChange(label: string, checked: boolean) {
        const map = new Map<string, boolean>([...labelsToCheckedMap])
        map.set(label, checked)
        const numChecked = [...map.values()]
            .filter(b => b)
            .length
        setSubmittable(numChecked >= 2)
        setLabelsToCheckedMap(map)
    }

    function onCancel() {
        init()
        props.setShow(false);
    }

    useEffect(() => {
        const body = document.querySelector('body')!
        if (props.show) {
            body.classList.add('modal-open')
        } else {
            body.classList.remove('modal-open')
        }
    }, [props.show]);

    return <div className={`light-box ${props.show ? 'show' : ''}`}>
            <dialog open={props.show} className={'dialog'}>
                <h2>Select displayed data (two series)</h2>
                <form method="dialog" onSubmit={onSubmit}>
                    <div className={'checkbox-list'}>
                    {props.allDataLabels.map((label, i) => {
                        const id = `checkbox${String(i)}`
                        return <div key={i}>
                            <input type="checkbox" name="state_name" value="Connecticut" id={id}
                                   checked={labelsToCheckedMap.get(label) ?? false} onChange={e => onFormChange(label, e.currentTarget.checked)}/>
                            <label htmlFor={id}>{label}</label>
                        </div>
                    })}
                    </div>
                    <div className={'buttons'}>
                        <button className={`ok-button button ${submittable ? 'enabled' : 'disabled'}`} disabled={!submittable}>OK</button>
                        <button onClick={onCancel} className={'button'}>Cancel</button>
                    </div>
                </form>
            </dialog>;
    </div>
}