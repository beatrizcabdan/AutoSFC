/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-unused-vars,no-unused-vars */
// noinspection JSUnusedLocalSymbols

import './App.module.scss'
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {EncodingDemo} from "./encoding-demo/EncodingDemo.tsx";
import {CspComparisonDemo} from "./csp-comparison-demo/CspComparisonDemo.tsx";
import {Fab} from "@mui/material";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import {Nav, NavSubMenu} from "./nav/Nav.tsx";
import {useNavigate, useSearchParams} from "react-router-dom";
import {createPath, scrollToSection} from "./utils.ts";
import {FeedbackDialog, OpenFeedbackWinBtn} from "./feedback/Feedback.tsx";
import {LandingSection} from "./landing-section/LandingSection.tsx";
import {PaperSection} from "./Papers.tsx";

export const API_BASE_URL = 'http://129.16.216.72:80'
export const DEV_PROJECT_NAME = 'AutoSFC-dev'

// eslint-disable-next-line react-refresh/only-export-components
export enum PlayStatus {
    PLAYING, PAUSED, REACHED_END
}

export const DEFAULT_SCALING_FACTOR = 10
export const DEFAULT_OFFSET = 100
export const DEFAULT_BITS_PER_SIGNAL = 14

const HIDE_MOBILE_NAV_WHEN_SCROLLING_DOWN = true

function App() {
    const [hideMobileNav, setHideMobileNav] = useState(false)
    const [showSubMenu, setShowSubMenu] = useState(false)

    const scrollPosRef = useRef<number>(0)
    const [scrollButtonClass, setScrollButtonClass] = useState('disabled')
    const [contactClass, setContactClass] = useState('')
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [showFeedbackForm, setShowFeedbackForm] = useState(false)

    useEffect(() => {
        // Log and set app details
        document.title = PROJECT_NAME
        console.info(`${PROJECT_NAME} ${APP_VERSION} — ${import.meta.env.MODE === 'development' ? 'dev' : 'prod'}\n` +
            `Latest commit: ${LATEST_COMMIT}`)
    }, []);

    const onScroll = useCallback(() => {
        const scrollingUp = document.documentElement.scrollTop < scrollPosRef.current
        const hideMenus = !scrollingUp && HIDE_MOBILE_NAV_WHEN_SCROLLING_DOWN
        setHideMobileNav(hideMenus)
        if (showSubMenu) {
            setShowSubMenu(!hideMenus)
        }
        setScrollButtonClass(scrollPosRef.current > window.innerHeight && scrollingUp ? '' : 'disabled')
        scrollPosRef.current = document.documentElement.scrollTop
    }, [scrollPosRef, showSubMenu])

    useEffect(() => {
        document.addEventListener('scroll', onScroll)
        return function () {
            document.removeEventListener('scroll', onScroll)
        }

    }, [onScroll]);

    useEffect(() => {
        if (searchParams.has('preset')) {
            scrollToSection('#encoding-demo')
        }
        setContactClass(searchParams.has('anonymize', 'true') ? 'hide' : '')
    }, [searchParams]);

    const onSectionClick = (path: string, sectionId: string) => {
        if (showSubMenu) {
            setShowSubMenu(false)
        }
        scrollToSection(sectionId);
        navigate(path)
    }

    const onScrollButtonClick = () => {
        const frames = 90
        const scrollSpeed = 20 * scrollPosRef.current / frames
        let frameCount = 0
        const int = setInterval(() => {
            if (document.scrollingElement!.scrollTop <= 0) {
                clearInterval(int)
            } else {
                document.scrollingElement!.scrollBy({top: -scrollSpeed * Math.exp(-frameCount * 0.2)})
                frameCount++
            }
        }, 17)
        navigate(createPath('', searchParams))
    }

    function getModeName() {
        return import.meta.env.MODE === 'development' ? 'dev' : 'prod'
    }

    return (
        <>
            <LandingSection modeName={getModeName()}/>

            <Nav scrollPos={scrollPosRef.current} hideMobileNav={hideMobileNav} onSectionClick={onSectionClick}
                 contactVisibilityClassName={contactClass} searchParams={searchParams} setShowSubMenu={setShowSubMenu}
                 showSubMenu={showSubMenu}/>
            <NavSubMenu contactClassName={contactClass} onContactClick={onSectionClick} searchParams={searchParams}
                        show={showSubMenu && !hideMobileNav} onFeedbackBtnClick={() => setShowFeedbackForm(true)}/>

            <div id={'main'}>
                <EncodingDemo onSectionClick={onSectionClick}/>
                <CspComparisonDemo onSectionClick={onSectionClick}/>
            </div>

            <PaperSection id={'previous-work'} sectionTitle={'Previous work using Space-Filling Curves (SFCs)'}
                          searchParams={searchParams} onSectionClick={onSectionClick}/>

            <PaperSection id={'about'} sectionTitle={'Space-Filling Curves (SFCs): what and why?'}
                          searchParams={searchParams} onSectionClick={onSectionClick}/>

            <div className={`tabcontent ${contactClass}`} id={'contact'}>
                <h1><a href={createPath('#contact', searchParams)}
                       onClick={e => e.preventDefault()}>
                    <span className={'section-hash-span'}
                          onClick={() => onSectionClick('#contact', createPath('#contact', searchParams))}>
                        #</span></a>
                    Want to collaborate? Contact us!</h1>

                <p>This website is under construction. If you want to know more about Space-Filling Curves (SFCs), or
                    driving event detection using them, feel free to send us an email to Beatriz Cabrero-Daniel at <a
                        href="mailto:beatriz.cabrero-daniel@gu.se">beatriz.cabrero-daniel@gu.se</a> for more info.</p>
                <br/>
                <br/>
                <br/>
            </div>

            {contactClass !== 'hide' && <OpenFeedbackWinBtn onClick={() => setShowFeedbackForm(true)}/>}

            {/*Switch to inverse anonymization logic after publication*/}
            <div className={`footer ${contactClass}`}>
                Demo of SFC encoding for automotive data. Site under construction.
                <span id={'contact-info'} className={contactClass}> Contact Beatriz Cabrero-Daniel at <a
                    href="mailto:beatriz.cabrero-daniel@gu.se">beatriz.cabrero-daniel@gu.se</a> for more info.
                </span>
                <div id={'app-info-div'}>
                    <p>{PROJECT_NAME} <span>{APP_VERSION}</span></p>
                    <p>•</p>
                    <p>Latest commit: <span>{LATEST_COMMIT}</span></p>
                    {(import.meta.env.MODE === 'development' || PROJECT_NAME === DEV_PROJECT_NAME) &&
                        <><p>•</p><p><span id={'mode-span'}>{getModeName()} mode</span></p></>}
                </div>
            </div>

            <FeedbackDialog show={showFeedbackForm} setShow={setShowFeedbackForm}/>

            <Fab variant="extended" color={'primary'} className={scrollButtonClass} size={'small'}
                 onClick={onScrollButtonClick}>
                <ArrowUpwardIcon sx={{mr: 0, ml: 0}}/>
            </Fab>
        </>
    )
}

export default App