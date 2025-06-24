/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-unused-vars,no-unused-vars */
// noinspection JSUnusedLocalSymbols

import './App.scss'

import React from 'react';
import {PaperContainer} from "./PaperContainer.tsx";
import {EncodingDemo} from "./EncodingDemo.tsx";
import {CspComparisonDemo} from "./CspComparisonDemo.tsx";

// eslint-disable-next-line react-refresh/only-export-components
export enum PlayStatus {
    PLAYING, PAUSED, REACHED_END
}

export const DEFAULT_SCALING_FACTOR = 10
export const DEFAULT_OFFSET = 100
export const DEFAULT_BITS_PER_SIGNAL = 14

function App() {
    return (
        <>
            <div className="landing-section">
                <img src="./logo2.png" alt="AutoSFC logo" className="header-img"/>
                <p>AutoSFC is a web-based demo for the research-activities around the usage of Space-Filling Curves
                    (SFC) for encoding and reducing the dimensionality of automotive data.</p>
            </div>

            <div className="topnav">
                <a className="active" href="#main">Demo</a>
                <a href="#work">Previous work</a>
                <a href="#about">About SFCs</a>
                <a href="#contact">Contact</a>
            </div>

            <div id={'main'}>
                {/*<EncodingDemo />*/}
                <CspComparisonDemo />
            </div>

            <div className="tabcontent" id={'work'}>
                <h1>Previous work using Space-Filling Curves (SFCs)</h1>

                <div className="papers-container">
                    <PaperContainer
                        title={"Systematic Evaluation of Applying Space-Filling Curves to Automotive Maneuver Detection"}
                        description={"In this paper, we are presenting a maneuver detection approach based on two variants of space-filling curves (Z-order and Hilbert) to detect maneuvers when passing roundabouts that do not use GPS data. We systematically evaluate their respective performance by including permutations of selections of kinematic signals at varying frequencies."}
                        url={"https://ieeexplore.ieee.org/abstract/document/10422366/"}/>
                    <PaperContainer
                        title={"ZEBRA: Z-order Curve-based Event Retrieval Approach to Efficiently Explore Automotive Data"}
                        description={"In this paper, we leverage Z-order space-filling curves to systematically reduce data dimensionality while preserving domain-specific data properties, which allows us to explore even large-scale field data sets to spot interesting events orders of magnitude faster than processing time-series data directly."}
                        url={"https://ieeexplore.ieee.org/abstract/document/10186770"}/>
                    <PaperContainer title={"Comparing the Locality Preservation of Z-order Curves and Hilbert Curves"}
                                    description={"We found that asymmetry in data can have a strong deleterious or advantageous effect on event querying, and surprisingly little difference in the True Positive to False Positive ratio of search results between Morton and Hilbert curves. Overall, we prove the viability of this use of both Morton and Hilbert curves for up to eight dimensions of data."}
                                    url={"https://gupea.ub.gu.se/handle/2077/77963"}/>
                    <PaperContainer title={"Extracting Driving Styles from Automotive Sensor Data to Develop Personas"}
                                    description={"Our approach is innovative in its use of dynamic, real-world driving data as opposed to static or direct user interaction data commonly employed in persona development. This allows for a deeper understanding of driver behaviors, which are indirectly inferred from sensor data, thus providing a foundation for creating detailed personas."}
                                    url={"https://ieeexplore.ieee.org/document/10773569"}/>
                    <PaperContainer
                        title={"Comparing Optical Flow and Deep Learning to Enable Computationally Efficient Traffic Event Detection with Space-Filling Curves"}
                        description={"We compare Optical Flow (OF) and Deep Learning (DL) to feed computationally efficient event detection via space-filling curves on video data from a forward-facing, in-vehicle camera. Our first approach leverages unexpected disturbances in the OF field from vehicle surroundings; the second approach is a DL model trained on human visual attention to predict a driver's gaze to spot potential event locations. We feed these results to a space-filling curve to reduce dimensionality and achieve computationally efficient event retrieval."}
                        url={"https://ieeexplore.ieee.org/abstract/document/10919665"}/>
                </div>
            </div>
            <div className="tabcontent" id={'about'}>
                <h1>Space-Filling Curves (SFCs): what and why?</h1>
                <div className="papers-container">
                    <PaperContainer title={"Space-Filling Curves"}
                                    description={"The present book provides an introduction to using space-filling curves (SFC) as tools in scientific computing. Special focus is laid on the representation of SFC and on resulting algorithms."}
                                    url={"https://link.springer.com/book/10.1007/978-3-642-31046-1"}/>
                    <PaperContainer
                        title={"SFCGen: A framework for efficient generation of multi-dimensional space-filling curves by recursion"}
                        description={"We describe a movement specification table, a universal turtle algorithm to enumerate points along a space-filling curve, a table-based indexing algorithm to transform coordinates of a point into its position along the curve and an algorithm to pregenerate the table automatically."}
                        url={"https://dl.acm.org/doi/abs/10.1145/1055531.1055537"}/>
                    <PaperContainer title={"Using Space-Filling Curves for Multi-dimensional Indexing"}
                                    description={"This paper presents and discusses a radically different approach to multi-dimensional indexing based on the concept of the space-filling curve."}
                                    url={"https://link.springer.com/chapter/10.1007/3-540-45033-5_3"}/>
                    <PaperContainer title={"Encoding and Decoding Algorithms for Arbitrary Dimensional Hilbert Order"}
                                    description={"Hilbert order is widely applied in many areas. However, most of the algorithms are confined to low dimensional cases. In this paper, algorithms for encoding and decoding arbitrary dimensional Hilbert order are presented."}
                                    url={"https://arxiv.org/abs/1601.01274"}/>
                </div>
            </div>

            <div className="tabcontent" id={'contact'}>
                <h1>Want to collaborate? Contact us!</h1>

                <p>This website is under construction. If you want to know more about Space-Filling Curves (SFCs), or
                    driving event detection using them, feel free to send us an email to Beatriz Cabrero-Daniel at <a
                        href="mailto:beatriz.cabrero-daniel@gu.se">beatriz.cabrero-daniel@gu.se</a> for more info.</p>
                <br/>
                <br/>
                <br/>
            </div>

            <div className="footer">
                Demo of SFC encoding for automotive data. Site under construction. Contact Beatriz Cabrero-Daniel at <a
                href="mailto:beatriz.cabrero-daniel@gu.se">beatriz.cabrero-daniel@gu.se</a> for more info.
            </div>

        </>
    )
}

export default App
