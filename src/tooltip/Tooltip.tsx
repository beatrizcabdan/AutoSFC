import React from "react";
import './Tooltip.scss'

export function Tooltip(props: {
    msg: string,
    showMsg: boolean,
    translate?: string,
    anchorRef: React.MutableRefObject<HTMLDivElement | null>
}) {
    function getAnchorCoords() {
        if (props.anchorRef && props.anchorRef.current) {
            const rect = props.anchorRef.current.getBoundingClientRect()
            return [rect.left + rect.width / 2, rect.top]
        }
        return ['initial', 'initial'];
    }

    return <p className={`tooltip ${props.showMsg ? "show" : ""}`}
              style={{translate: props.translate ?? '-50% -200%', top: getAnchorCoords()[1],
                  left: getAnchorCoords()[0]}}>{props.msg}</p>;
}