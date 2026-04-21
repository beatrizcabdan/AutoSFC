import React, {ReactElement, useCallback, useEffect} from "react";
import './Dialog.scss'

interface DialogProps {
        show: boolean;
        children: React.ReactElement;
        title: string;
        setHide: () => void;
        allowScroll?: boolean;
        className?: string;
        blurBackground?: boolean
}

export const Dialog = (props: DialogProps) => {
    const scrollCallback = useCallback((e: Event) => {
        e.preventDefault()
    }, [])

    // Block scrolling when dialog open
    useEffect(() => {
        if (!props.allowScroll) {
            const body = document.querySelector('body')!
            if (props.show) {
                body.addEventListener('wheel', scrollCallback, {passive: false})
            } else {
                body.removeEventListener('wheel', scrollCallback,)
            }
        }
    }, [props.allowScroll, props.show, scrollCallback]);

    function onLightBoxClick(): void {
        props.setHide()
    }

    function onDialogClick(e: React.MouseEvent<HTMLDialogElement>): void {
        e.stopPropagation()
    }

    return <div className={`light-box ${props.show ? 'show' : ''} ${props.blurBackground ? 'blur' : ''}`}
                onClick={onLightBoxClick}>
        <dialog open={props.show} className={`dialog ${props.className ?? ''}`} onClick={e => onDialogClick(e)}>
            <h2>{props.title}</h2>
            {props.children}
        </dialog>
        ;
    </div>
}

Dialog.defaultProps = {
    blurBackground: true
}