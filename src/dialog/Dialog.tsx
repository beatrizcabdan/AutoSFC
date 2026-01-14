import React, {ReactElement, useCallback, useEffect} from "react";
import './Dialog.scss'

export const Dialog = (props: { show: boolean, children: ReactElement, title: string,
    setHide: () => void
}) => {

    const scrollCallback = useCallback((e: Event) => {
        e.preventDefault()
    }, [])

    // Block scrolling when dialog open
    useEffect(() => {
        const body = document.querySelector('body')!
        if (props.show) {
            body.addEventListener('wheel', scrollCallback, {passive: false} )
        } else {
            body.removeEventListener('wheel', scrollCallback, )
        }
    }, [props.show, scrollCallback]);

    function onLightBoxClick(): void {
        props.setHide()
    }

    function onDialogClick(e: React.MouseEvent<HTMLDialogElement>): void {
        e.stopPropagation()
    }

    return <div className={`light-box ${props.show ? 'show' : ''}`} onClick={onLightBoxClick}>
        <dialog open={props.show} className={'dialog'} onClick={e => onDialogClick(e)}>
            <h2>{props.title}</h2>
            {props.children}
        </dialog>
        ;
    </div>
}