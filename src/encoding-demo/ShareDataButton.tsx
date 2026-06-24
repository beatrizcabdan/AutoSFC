import {Button} from "@mui/material";
import './ShareDataButton.scss'

interface ShareDataButtonProps {
    onShareClick: () => void
}

export function ShareDataButton({onShareClick}: ShareDataButtonProps) {
    return <Button className={'share-data-button'} onClick={onShareClick}>Share data...</Button>;
}