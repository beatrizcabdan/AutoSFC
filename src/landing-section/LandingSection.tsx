import React from "react";
import {DEV_PROJECT_NAME} from "../App.tsx";
import './LandingSection.scss'

interface LandingSectionProps {
    modeName: string
}

export function LandingSection({modeName}: LandingSectionProps) {
    return <div className="landing-section">
        <img src="./logo2.png" alt="AutoSFC logo" className="header-img"/>
        <p>AutoSFC is a web-based demo for the research-activities around the usage of Space-Filling Curves
            (SFC) for encoding and reducing the dimensionality of automotive data.</p>
        <p className={"size-warning-p"}>This website is optimized for larger screen sizes.</p>
        {(PROJECT_NAME === DEV_PROJECT_NAME) &&
            <div id={'version-banner-div'}>
                <h3 id={'version-banner-h3'}>Dev version</h3>
            </div>
        }
    </div>;
}