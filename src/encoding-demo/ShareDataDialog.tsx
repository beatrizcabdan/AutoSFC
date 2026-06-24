import {Dialog} from "../dialog/Dialog.tsx";
import {Button, TextField} from "@mui/material";
import './ShareDataDialog.scss'
import {URLSearchParams} from "node:url";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {useEffect, useRef, useState} from "react";
import {computeUrlHash} from "../utils.ts";
import {ISnackbarMessage} from "../snackbar/SnackBar.tsx";

export function ShareDataDialog(props: {
    show: boolean,
    setShowShareDataDialog: (value: (((prevState: boolean) => boolean) | boolean)) => void,
    startLine: number,
    endLine: number,
    searchParams: URLSearchParams,
    setSnackbarMessage: (value: (((prevState: ISnackbarMessage) => ISnackbarMessage) | ISnackbarMessage)) => void,
    encoder: string,
    bitsPerSignal: number | string,
    plotTransformedSignals: boolean,
    minSfcValue: number,
    maxSfcValue: number,
    displayedSignals: string[] | null,
    offsets: (number | undefined)[],
    scales: (number | undefined)[],
    autoSfcVersion: string
}) {
    const textFieldRef = useRef<HTMLTextAreaElement>()
    const [url, setUrl] = useState('')

    // https://stackoverflow.com/a/64317676
    const fixedEncodeURIComponent = (str: string) => encodeURIComponent(str)
        .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0)
        .toString(16));


    const getParams = () => {
        return `${window.location.origin}/?` +
            (props.searchParams.has('file') ? `file=${encodeURIComponent(props.searchParams.get('file')!)}` : '') +
            (props.searchParams.has('contentHash') ? `&contentHash=${encodeURIComponent(props.searchParams.get('contentHash')!)}` : '') +
            `&displayedRange=${props.startLine}-${props.endLine}` +
            `&encoder=${props.encoder}&bitsPerSignal=${props.bitsPerSignal}` +
            `&plotTransformedSignals=${props.plotTransformedSignals}` +
            `&sfcRange=${props.minSfcValue}-${props.maxSfcValue}` +
            (props.displayedSignals ? `&displayedSignals=${fixedEncodeURIComponent(props.displayedSignals
                .join(',').replace(/\s/g, '+'))}` : '') +
            (props.offsets ? `&offsets=${encodeURIComponent(props.offsets.join(','))}` : '') +
            (props.scales ? `&scalings=${encodeURIComponent(props.scales.join(','))}` : '') +
            `&autoSfcVersion=${props.autoSfcVersion}` +
            (props.searchParams.has('anonymize') ? `&anonymize=${encodeURIComponent(props.searchParams.get('anonymize')!)}` : '')
    }

    useEffect(() => {
        if (props.show) {
            const params = getParams()
            computeUrlHash(params).then(hash => setUrl(`${params}&urlHash=${hash}#encoding-demo`))
            textFieldRef.current?.focus()
            textFieldRef.current?.setSelectionRange(0, textFieldRef.current?.value.length ?? 0)
        }
    }, [props.show]);

    const onButtonClick = () => {
        const url = textFieldRef.current?.value!
        navigator.clipboard.writeText(url)
            .then(() => {
                props.setShowShareDataDialog(false)
                props.setSnackbarMessage({message: 'URL copied to clipboard!', status: 'success'})
            })
    }

    return <Dialog show={props.show} title={'Share Encoding demo state as URL'} className={'share-data-dialog'}
                   setHide={() => props.setShowShareDataDialog(false)}>
        <>
            <TextField multiline={true} rows={10} value={url} autoFocus inputRef={textFieldRef}
                       onFocus={(event) => {
                           event.target.select();
                       }}/>
            <Button startIcon={<ContentCopyIcon />} onClick={onButtonClick}
                    className={'blue-border-button'}>Copy and close</Button>
        </>
    </Dialog>
}