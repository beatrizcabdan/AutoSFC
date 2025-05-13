import React from "react";

export function PaperContainer( props: { title : string, description : string, url : string }) {
    return <div className="paper-block">
        <h2 className="paper-title">{props.title}</h2>
        <p className="paper-description"> {props.description} </p>
        <div className="paper-buttons">
            <button className="button"><a href={props.url}>View PDF</a></button>
            <button className="button">More info</button>
        </div>
    </div>;
}