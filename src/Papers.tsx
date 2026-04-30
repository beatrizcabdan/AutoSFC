import {createPath} from "./utils.ts";
import React from "react";
import {Button} from "@mui/material";
import papers from './assets/papers.json'
import {URLSearchParams} from "node:url";

interface IPaperData {
    title: string,
    description: string,
    url: string
}

export function PaperContainer(props: { title: string, description: string, url: string }) {
    return <div className="paper-block">
        <h2 className="paper-title">{props.title}</h2>
        <p className="paper-description"> {props.description} </p>
        <div className="paper-buttons">
            <Button className="link-button"><a href={props.url}>View PDF</a></Button>
            {/*<button className="button">More info</button>*/}
        </div>
    </div>;
}

export function PaperSection(props: {
    id: string,
    sectionTitle: string,
    searchParams: URLSearchParams,
    onSectionClick: (path: string, sectionId: string) => void
}) {

    const getPapers = () => {
        // @ts-ignore
        return papers[props.id]
    };

    return <div className="tabcontent" id={props.id}>
        <h1><a href={createPath(`#${props.id}`, props.searchParams)}
               onClick={e => e.preventDefault()}>
                    <span className={"section-hash-span"}
                          onClick={() => props.onSectionClick(createPath(`#${props.id}`, props.searchParams),
                              `#${props.id}`)}>
                        #</span></a>
            {props.sectionTitle}</h1>

        <div className="papers-container">
            {getPapers().map((paper: IPaperData) =>
                <PaperContainer title={paper.title} description={paper.description} url={paper.url} key={paper.title}/>)}
        </div>
    </div>;
}