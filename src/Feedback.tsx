import {
    Button,
    FormControl,
    FormControlLabel,
    InputLabel, OutlinedInput,
    Radio,
    RadioGroup,
    TextField
} from "@mui/material"
import './Feedback.scss'
import {Dialog} from "./Dialog.tsx";
import React, {Dispatch, FormEvent, SetStateAction, useState} from "react";

interface OpenFeedbackWinBtnProps {
    onClick?: () => void
}

export const OpenFeedbackWinBtn = ({onClick}: OpenFeedbackWinBtnProps) =>
    <Button id={'open-feedback-win-btn'} onClick={onClick}>
    Feedback
</Button>

// TODO: Fix mobile dialog
export const FeedbackDialog = (props: {
    show: boolean,
    setShow: Dispatch<SetStateAction<boolean>> }) => {
    const defaultFeedbackType = 'feedback'
    const [submittable, setSubmittable] = useState(false)
    const [feedbackType, setFeedbackType] = useState(defaultFeedbackType)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const reInit = () => {
        setFeedbackType(defaultFeedbackType)
        setName('')
        setEmail('')
        setMessage('')
        setSubmittable(false)
        setSubmitted(false)
    }

    function onSubmit(e: FormEvent<HTMLFormElement>) {
        if (!submittable) {
            e.preventDefault()
            return
        }
        const json = JSON.stringify({
            name: name,
            email: email,
            type: feedbackType,
            message: message
        })
        console.log(JSON.parse(json))
        // reInit()
        // props.setShow(false);
        setSubmitted(true)
    }

    function onCancel() {
        reInit()
        props.setShow(false);
    }

    function onFeedbackTypeChange(_: React.ChangeEvent<HTMLInputElement>, value: string) {
        setFeedbackType(value)
    }

    function onMessageFieldChange(e: React.ChangeEvent<HTMLInputElement>) {
        setMessage(e.target.value)
        setSubmittable(Boolean(e.target.value))
    }

    return <Dialog show={props.show} title={submitted ? '' : 'We love feedback 💬'}>
        <>
            <div id={'feedback-dialog-div'} className={!submitted ? 'show' : ''}>
                <p>Found a bug or have ideas on how to improve this website? Please let us know!</p>
                <form method="dialog" onSubmit={onSubmit}>
                    <div id={'name-email-div'}>
                        <FormControl>
                            <InputLabel htmlFor="component-outlined" shrink>Name</InputLabel>
                            <OutlinedInput
                                id="component-outlined"
                                label="Name"
                                name={'name'}
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </FormControl>
                        <FormControl>
                            <InputLabel htmlFor="component-outlined" shrink>E-mail</InputLabel>
                            <OutlinedInput
                                id="component-outlined"
                                label="E-mail"
                                name={'email'}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </FormControl>
                    </div>
                    <TextField multiline rows={4} onChange={onMessageFieldChange} name={'message'} value={message}/>
                    <FormControl id={'feedback-type-radio-buttons'}>
                        <RadioGroup defaultValue={defaultFeedbackType} onChange={onFeedbackTypeChange} row>
                            <FormControlLabel value={'feedback'} control={<Radio size={'small'}/>} label={'Feedback'}
                                              className={`radio-button ${feedbackType === 'feedback' ? 'selected' : ''}`}/>
                            <FormControlLabel value={'bug-report'} control={<Radio size={'small'}/>} label={'Bug report'}
                                              className={`radio-button ${feedbackType === 'bug-report' ? 'selected' : ''}`}/>
                        </RadioGroup>
                    </FormControl>
                    <div className={'form-buttons'}>
                        <Button type={'submit'} className={`ok-button button ${submittable ? 'enabled' : 'disabled'}`}
                                disabled={!submittable}>OK</Button>
                        <Button onClick={onCancel} className={'button'}>Cancel</Button>
                    </div>
                </form>
            </div>
            <div id={'thanks-dialog-div'} className={submitted ? 'show' : ''}>
                <h2>Thanks for your feedback! 🙌</h2>
                <Button className={'button'} onClick={onCancel}>Close</Button>
            </div>
        </>
    </Dialog>
}