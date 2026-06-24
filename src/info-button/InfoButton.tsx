import {useRef, useState} from "react";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {Tooltip} from "../tooltip/Tooltip.tsx";
import './InfoButton.scss'

export function InfoButton(props: { msg: string, translateTooltip?: string, top?: string, left?: string }) {
    const iconRef = useRef(null)
    const [showTooltip, setShowTooltip] = useState(false)
    return <>
        <Tooltip msg={props.msg} showMsg={showTooltip} anchorRef={iconRef} translate={props.translateTooltip ?? '-50% -160%'}/>
        <InfoOutlinedIcon fontSize={'small'} className={'info-icon'} ref={iconRef}
                          onMouseOver={() => setShowTooltip(true)}
                          onMouseOut={() => setShowTooltip(false)}/>
    </>;
}