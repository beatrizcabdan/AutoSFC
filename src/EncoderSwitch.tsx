import {Stack, styled, Switch, Typography} from "@mui/material";

const AntSwitch = styled(Switch)(({theme}) => ({
    width: 32,
    height: 16,
    padding: 0,
    display: 'flex',
    '&:active': {
        '& .MuiSwitch-thumb': {
            width: 15,
        },
        '& .MuiSwitch-switchBase.Mui-checked': {
            transform: 'translateX(13px)',
        },
    },
    '& .MuiSwitch-switchBase': {
        padding: 2,
        '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
                opacity: 1,
                backgroundColor: '#1890ff',
                ...theme.applyStyles('dark', {
                    backgroundColor: '#177ddc',
                }),
            },
        },
    },
    '& .MuiSwitch-thumb': {
        boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
        width: 12,
        height: 12,
        borderRadius: 6,
        transition: theme.transitions.create(['width'], {
            duration: 200,
        }),
    },
    '& .MuiSwitch-track': {
        borderRadius: 16 / 2,
        opacity: 1,
        boxSizing: 'border-box',
        backgroundColor: '#1890ff',
        ...theme.applyStyles('dark', {
            backgroundColor: '#177ddc'
        }),
    },
}));

export const EncoderSwitch = (props: { encoder: string, onSwitch: () => void,
    size?: string, className?: string }) => {
    return <Stack direction="row" spacing={1} sx={{alignItems: 'center'}} className={`encoder-switch ${props.className}`}>
        <Typography className={`encoding-label ${props.encoder === 'hilbert' ? 'unchecked' : 'checked'} 
        ${props.size === 'small' ? 'small' : ''}`}>Morton</Typography>
        <AntSwitch inputProps={{'aria-label': 'ant design'}} onChange={props.onSwitch} checked={props.encoder === 'hilbert'}
                   sx={{scale: props.size === 'small' ? 0.85 : 1}}/>
        <Typography className={`encoding-label ${props.encoder === 'hilbert' ? 'checked' : 'unchecked'} 
        ${props.size === 'small' ? 'small' : ''}`}>Hilbert</Typography>
    </Stack>
};