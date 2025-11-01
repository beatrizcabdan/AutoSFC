import React, {useEffect, useRef, useState} from "react";
import './Nav.scss'
import {createPath} from "./utils.ts";

interface NavProps {
    scrollPos: number,
    hideMobileNav: boolean,
    contactVisibilityClassName?: string,
    onSectionClick: (path: string, sectionId: string) => void,
    searchParams: URLSearchParams
}

function NavLink(props: {
    title: string,
    sectionId: string,
    onSectionClick: (path: string, sectionId: string) => void,
    className?: string | undefined,
    searchParams: URLSearchParams,
    icon: string
}) {

    const pathRef = useRef('')

    useEffect(() => {
        pathRef.current = createPath(props.sectionId, props.searchParams);
    }, [props.sectionId, props.searchParams]);

    return <a onClick={e => e.preventDefault()}
              href={pathRef.current}>
        <div className={`active ${props.className ?? ''}`} onClick={() => props.onSectionClick(pathRef.current,
            props.sectionId)}>
            <span className="material-symbols-outlined">{props.icon}</span>{props.title}
        </div>
    </a>;
}

export function Nav({scrollPos, hideMobileNav, contactVisibilityClassName, onSectionClick, searchParams}: NavProps) {
    const [navHeight, setNavHeight] = useState(0)

    useEffect(() => {
        const topnav = document.querySelector('.topnav') as HTMLElement
        const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const navHeight = topnav ? topnav.offsetHeight * 100 / h : -1
        setNavHeight(navHeight)
    }, []);

    return <div className={`topnav ${scrollPos < navHeight ? 'top-pos' : ''} ${hideMobileNav ? 'hide' : ''}`}>
        <NavLink sectionId={"#encoding-demo"} onSectionClick={onSectionClick} icon={'swap_horiz'}
                 title={'Encoding Demo'} searchParams={searchParams}/>
        <NavLink sectionId={"#comparison-demo"} onSectionClick={onSectionClick} searchParams={searchParams}
                 title={'Comparison Demo'} icon={'barcode'}/>
        <NavLink sectionId={"#previous-work"} onSectionClick={onSectionClick} searchParams={searchParams}
                 title={'Previous work'} icon={'article'}/>
        <NavLink sectionId={"#about"} onSectionClick={onSectionClick} searchParams={searchParams}
                 title={'About SFCs'} icon={'info'}/>
        <NavLink className={contactVisibilityClassName} sectionId={"#contact"} onSectionClick={onSectionClick}
                 searchParams={searchParams} icon={'alternate_email'} title={'Contact'}/>
    </div>
}