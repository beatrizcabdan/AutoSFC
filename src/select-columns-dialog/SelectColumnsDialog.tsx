import React, {Dispatch, FormEvent, SetStateAction, useEffect, useState} from "react";
import './SelectColumnsDialog.scss'
import {Button} from "@mui/material";
import {Dialog} from "../dialog/Dialog.tsx";

export function SelectColumnsDialog(props: {
    show: boolean,
    setShow: Dispatch<SetStateAction<boolean>>,
    allDataLabels: string[],
    setDataLabels: (newLabels: string[]) => void,
    currentLabels: string[] | null,
    demoName: string
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
        props.setShow(false);
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

    return <Dialog show={props.show} title={'Select displayed data (two series)'} setHide={onCancel}>
        <div id={'select-columns-div'}>
                <form method="dialog" onSubmit={onSubmit}>
                    <div className={'checkbox-list'}>
                    {props.allDataLabels.map((label, i) => {
                        const id = `${props.demoName}-checkbox${String(i)}`
                        return <div key={i}>
                            <input type="checkbox" name="state_name" value="Connecticut" id={id}
                                   checked={labelsToCheckedMap.get(label) ?? false} onChange={e => onFormChange(label, e.currentTarget.checked)}/>
                            <label htmlFor={id}>{label}</label>
                        </div>
                    })}
                    </div>
                    <div className={'form-buttons'}>
                        <Button type={'submit'} className={`ok-button button ${submittable ? 'enabled' : 'disabled'}`} disabled={!submittable}>OK</Button>
                        <Button onClick={onCancel} className={'button'}>Cancel</Button>
                    </div>
                </form>
            </div>
        </Dialog>
}