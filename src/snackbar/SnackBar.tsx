import {Alert, AlertColor, Button, Slide, Snackbar, SnackbarContent} from "@mui/material";
import {useEffect, useState} from "react";
import './SnackBar.scss'

interface SnackBarProps {
    snackbarMessage: string,
    status: AlertColor,
    setStatus: (value: (((prevState: AlertColor) => AlertColor) | AlertColor)) => void,
    setSnackbarMessage: (value: (((prevState: string) => string) | string)) => void
}

/**
 * Toast/snackbar. Will show unless msg is empty string.
 */
export function SnackBar({snackbarMessage, status, setStatus, setSnackbarMessage}: SnackBarProps) {
    const AUTO_HIDE_DURATION = 5000

    const [show, setShow] = useState(true)

    useEffect(() => {
        setShow(!!snackbarMessage)
    }, [snackbarMessage]);

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
        action={<Button>OK</Button>}>
        <Alert variant="filled" severity={status} onClose={status === 'warning' ? onClose : undefined}>
            {snackbarMessage}
        </Alert>
    </Snackbar>
}