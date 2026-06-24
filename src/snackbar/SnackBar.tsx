import {Alert, AlertColor, Button, Slide, Snackbar, SnackbarContent} from "@mui/material";
import React, {useEffect, useState} from "react";
import './SnackBar.scss'

export interface ISnackbarMessage {
    message: string,
    status: AlertColor
}

interface ISnackBarProps {
    snackbarMessage: ISnackbarMessage,
    setSnackbarMessage: (value: (((prevState: ISnackbarMessage) => ISnackbarMessage) | ISnackbarMessage)) => void,
    navRef: React.MutableRefObject<HTMLDivElement | undefined>,
    mobileNavVisible?: boolean
}

/**
 * Toast/snackbar. Will show unless snackbarMessage.message is empty string. TODO: Allow multiple snackbars at once.
 */
export function SnackBar({snackbarMessage, setSnackbarMessage, navRef, mobileNavVisible}: ISnackBarProps) {
    const AUTO_HIDE_DURATION = 5000

    const [message, setMessage] = useState<ISnackbarMessage>({message: '', status: 'success'})
    const [show, setShow] = useState(true)
    const [verticalOffset, setVerticalOffset] = useState<number>(0)

    useEffect(() => {
        setShow(!!message.message)
        if (!!message.message) {
            console.log(message.message)
            const rect = navRef.current?.getBoundingClientRect()
            if (mobileNavVisible && rect?.top !== undefined && rect.top > 0) {
                setVerticalOffset(rect.height)
            } else {
                setVerticalOffset(0)
            }
        } else {
            setVerticalOffset(0)
        }
    }, [message, navRef, mobileNavVisible]);

    // Only change current message if new message is empty (i.e. hide message), or new message has same or higher severity
    // level.
    useEffect(() => {
        if (!snackbarMessage.message) {
            setMessage({message: '', status: 'success'})
        } else if (!message.message
            || message.status === 'success'
            || message.status === 'warning' && snackbarMessage.status === 'warning'
            || snackbarMessage.status === 'error') {
            setMessage(snackbarMessage)
        }

    }, [snackbarMessage]);

    const onClose = () => {
        setShow(false)
        setTimeout(() => {
            setSnackbarMessage({message: '', status: 'success'})
            setMessage({message: '', status: 'success'})
        }, 1000)
    }

    return <Snackbar
        open={show}
        onClose={onClose}
        slots={{transition: Slide}}
        autoHideDuration={message.status === 'success' ? AUTO_HIDE_DURATION : undefined}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
        sx={{translate: `0 -${verticalOffset}px`}}
        action={<Button>OK</Button>}>
        <Alert variant="filled" severity={message.status}
               onClose={(message.status === 'warning' || message.status === 'error') ? onClose : undefined}>
            {message.message}
        </Alert>
    </Snackbar>
}