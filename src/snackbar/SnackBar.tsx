import {Slide, Snackbar} from "@mui/material";
import {useEffect, useState} from "react";
import './SnackBar.scss'

interface SnackBarProps {
    msg: string,
}

/**
 * Toast/snackbar. Will show unless msg is empty string.
 */
export function SnackBar({msg}: SnackBarProps) {
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [show, setShow] = useState(true)

    useEffect(() => {
        setSnackbarMessage(msg)
        setShow(!!msg)
    }, [msg]);

    return <Snackbar
        open={show}
        onClose={() => setShow(false)}
        slots={{transition: Slide}}
        message={snackbarMessage}
        autoHideDuration={5000}
        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
    />
}