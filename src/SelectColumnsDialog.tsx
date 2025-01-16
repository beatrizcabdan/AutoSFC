import React, {MutableRefObject} from "react";
import './SelectColumnsDialog.scss'

export function SelectColumnsDialog(props: {show: boolean, dataLabelsRef:  MutableRefObject<string[]>}) {
    console.log(props.dataLabelsRef.current)
    return <div className={'light-box'}>
            <dialog open className={'dialog'}>
                <h2>Select displayed data</h2>
                <form method="dialog">
                    <div className={'checkbox-list'}>
                    {props.dataLabelsRef.current.map((label, i) => {
                        const id = `checkbox${String(i)}`
                        // noinspection HtmlUnknownAttribute
                        return <div>
                            <input type="checkbox" name="state_name" value="Connecticut" id={id}/>
                            <label for={id}>{label}</label>
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