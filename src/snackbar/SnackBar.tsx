import {Alert, AlertColor, Button, Slide, Snackbar, SnackbarContent} from "@mui/material";
import React, {useEffect, useState} from "react";
import './SnackBar.scss'

interface SnackBarProps {
    snackbarMessage: string,
    status: AlertColor,
    setStatus: (value: (((prevState: AlertColor) => AlertColor) | AlertColor)) => void,
    setSnackbarMessage: (value: (((prevState: string) => string) | string)) => void,
    navRef: React.MutableRefObject<HTMLDivElement | undefined>,
    mobileNavVisible?: boolean
}

/**
 * Toast/snackbar. Will show unless msg is empty string.
 */
export function SnackBar({
                             snackbarMessage,
                             status,
                             setStatus,
                             setSnackbarMessage,
                             navRef,
                             mobileNavVisible
                         }: SnackBarProps) {
    const AUTO_HIDE_DURATION = 5000

    const [show, setShow] = useState(true)
    const [verticalOffset, setVerticalOffset] = useState<number>(0)

    useEffect(() => {
        setShow(!!snackbarMessage)
        if (!!snackbarMessage) {
            const rect = navRef.current?.getBoundingClientRect()
            if (mobileNavVisible && rect?.top !== undefined && rect.top > 0) {
                setVerticalOffset(rect.height)
            } else {
                setVerticalOffset(0)
            }
        } else {
            setVerticalOffset(0)
        }
    }, [snackbarMessage, navRef, mobileNavVisible]);

    const onClose = () => {
        setShow(false)
        setTimeout(() => {
            setSnackbarMessage('')
            setStatus('success')
        }, 1000)
    }

    return <Snackbar
        open={show}
        onClose={onClose}
        slots={{transition: Slide}}
        autoHideDuration={status === 'success' ? AUTO_HIDE_DURATION : undefined}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        sx={{translate: `0 -${verticalOffset}px`}}
        action={<Button>OK</Button>}>
        <Alert variant="filled" severity={status} onClose={status === 'warning' ? onClose : undefined}>
            {snackbarMessage}
        </Alert>
    </Snackbar>
}