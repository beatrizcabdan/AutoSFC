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
    searchParams: URLSearchParams
}) {

    const pathRef = useRef('')

    useEffect(() => {
        pathRef.current = createPath(props.sectionId, props.searchParams);
    }, [props.sectionId, props.searchParams]);

    return <a onClick={e => e.preventDefault()}
              href={pathRef.current}>
        <div className={`active ${props.className ?? ''}`} onClick={() => props.onSectionClick(pathRef.current,
            props.sectionId)}>
            <span className="material-symbols-outlined">swap_horiz</span>{props.title}
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
        <NavLink sectionId={"#encoding-demo-div"} onSectionClick={onSectionClick}
                 title={'Encoding Demo'} searchParams={searchParams}/>
        <NavLink sectionId={"#comp-demo-div"} onSectionClick={onSectionClick} searchParams={searchParams}
                 title={'Comparison Demo'}/>
        <NavLink sectionId={"#work"} onSectionClick={onSectionClick} searchParams={searchParams}
                 title={'Previous work'}/>
        <NavLink sectionId={"#about"} onSectionClick={onSectionClick} searchParams={searchParams}
                 title={'About SFCs'}/>
        <NavLink className={contactVisibilityClassName} sectionId={"#contact"} onSectionClick={onSectionClick}
                 searchParams={searchParams} title={'Contact'}/>
    </div>
}