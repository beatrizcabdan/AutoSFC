import React, {MutableRefObject} from "react";
import './SelectColumnsDialog.scss'

export function SelectColumnsDialog(props: {show: boolean, dataLabelsRef:  MutableRefObject<string[]>}) {
    console.log(props.dataLabelsRef.current)
    return <div className={'light-box'}>
            <dialog open className={'dialog'}>
                <p>Select displayed data</p>
                <form method="dialog">
                    {props.dataLabelsRef.current.map(label => )}
                    <button>OK</button>
                </form>
            </dialog>;
    </div>
}