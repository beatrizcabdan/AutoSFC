import React, {ReactElement, useCallback, useEffect} from "react";
import './Dialog.scss'

interface DialogProps {
    show: boolean,
    children: React.ReactElement,
    title: string,
    setHide: () => void,
    allowScroll?: boolean,
    className?: string,
    blurBackground?: boolean,
    onHide?: () => void
}

// noinspection JSCommentMatchesSignature
/**
 * @param setHide Handle to call when dialog should hide
 * @param onHide Handle called when dialog becomes hidden
 */
export const Dialog = (props: DialogProps) => {
    const {blurBackground = true} = props

    const scrollCallback = useCallback((e: Event) => {
        e.preventDefault()
    }, [])

    useEffect(() => {
        // Block scrolling when dialog open
        if (!props.allowScroll) {
            const body = document.querySelector('body')!
            if (props.show) {
                body.addEventListener('wheel', scrollCallback, {passive: false})
            } else {
                body.removeEventListener('wheel', scrollCallback,)
            }
        }
        if (!props.show && props.onHide) {
            props.onHide()
        }
    }, [props.allowScroll, props.show, scrollCallback]);

    function onLightBoxClick(): void {
        props.setHide()
    }

    function onDialogClick(e: React.MouseEvent<HTMLDialogElement>): void {
        e.stopPropagation()
    }

    return <div className={`light-box ${props.show ? 'show' : ''} ${blurBackground ? 'blur' : ''}`}
                onClick={onLightBoxClick}>
        <dialog open={props.show} className={`dialog ${props.className ?? ''}`} onClick={e => onDialogClick(e)}>
            <h2>{props.title}</h2>
            {props.children}
        </dialog>
        ;
    </div>
}