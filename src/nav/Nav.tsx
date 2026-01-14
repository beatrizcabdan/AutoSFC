import React, {useEffect, useRef, useState} from "react";
import './Nav.scss'
import {createPath} from "../utils.ts";

interface NavProps {
    scrollPos: number,
    hideMobileNav: boolean,
    contactVisibilityClassName?: string,
    onSectionClick: (path: string, sectionId: string) => void,
    searchParams: URLSearchParams,
    setShowSubMenu: (value: (((prevState: boolean) => boolean) | boolean)) => void,
    showSubMenu: boolean
}

function NavLink(props: {
    title: string, sectionId: string, onSectionClick: (path: string, sectionId: string) => void,
    className?: string | undefined, searchParams: URLSearchParams, icon: string, id?: string }) {
    const pathRef = useRef('')

    useEffect(() => {
        pathRef.current = createPath(props.sectionId, props.searchParams);
    }, [props.sectionId, props.searchParams]);

    const onDivClick = () => {
        props.onSectionClick(pathRef.current, props.sectionId);
    }
    return <a onClick={e => e.preventDefault()}
              href={pathRef.current} id={props.id ?? ''}>
        <div className={`navlink-div ${props.className ?? ''}`}
             onClick={onDivClick}>
            <span className="material-symbols-outlined">{props.icon}</span>
            <span className={'navlink-text-span'}>{props.title}</span>
        </div>
    </a>
}

interface HamburgerMenuProps {
    onMenuClick: () => void,
    subMenuVisible?: boolean
}

function HamburgerMenu({onMenuClick, subMenuVisible}: HamburgerMenuProps) {
    return <a id={`hamburger-menu-a`} onClick={e =>
    {e.preventDefault();onMenuClick()}}>
        <div className={`navlink-div ${subMenuVisible ? 'active' : ''}`}>
            <span className="material-symbols-outlined">menu</span>More
        </div>
    </a>;
}

export function NavSubMenu(props: {
    contactClassName: string | undefined, onContactClick: (path: string, sectionId: string) => void,
    searchParams: URLSearchParams, show: boolean, onFeedbackBtnClick: () => void
}) {
    const onFeedbackBtnClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        props.onFeedbackBtnClick()
    }
    return <div id={"nav-submenu-div"} className={`${!props.show ? 'hide' : ''}`}>
        <NavLink className={props.contactClassName} sectionId={"#contact"} onSectionClick={props.onContactClick}
                 searchParams={props.searchParams} icon={"alternate_email"} title={"Contact"} id={"contact-link"}/>
        <a onClick={onFeedbackBtnClick} href={''}>
            <div className={`navlink-div`}>
                <span className="material-symbols-outlined">feedback</span>Feedback
            </div>
        </a>

    </div>;
}

export function Nav({scrollPos, hideMobileNav, contactVisibilityClassName, onSectionClick, searchParams,
                        setShowSubMenu, showSubMenu}: NavProps) {
    const [navHeight, setNavHeight] = useState(0)

    useEffect(() => {
        const topnav = document.querySelector('.topnav') as HTMLElement
        const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const navHeight = topnav ? topnav.offsetHeight * 100 / h : -1
        setNavHeight(navHeight)
    }, []);

    // @ts-ignore
    return <div className={`topnav ${scrollPos < navHeight ? 'top-pos' : ''} ${hideMobileNav ? 'hide' : ''}`}>
        <div className={'link-container'}>
            <NavLink sectionId={"#encoding-demo"} onSectionClick={onSectionClick} icon={'swap_horiz'}
                     title={'Encoding Demo'} searchParams={searchParams}/>
            <NavLink sectionId={"#comparison-demo"} onSectionClick={onSectionClick} searchParams={searchParams}
                     title={'Comparison Demo'} icon={'barcode'}/>
            <NavLink sectionId={"#previous-work"} onSectionClick={onSectionClick} searchParams={searchParams}
                     title={'Previous work'} icon={'article'}/>
            <NavLink sectionId={"#about"} onSectionClick={onSectionClick} searchParams={searchParams}
                     title={'About SFCs'} icon={'info'}/>
            <NavLink className={contactVisibilityClassName} sectionId={"#contact"} onSectionClick={onSectionClick}
                     searchParams={searchParams} icon={'alternate_email'} title={'Contact'} id={'contact-link'}/>
            <HamburgerMenu subMenuVisible={showSubMenu} onMenuClick={() => setShowSubMenu(prev => !prev)}/>
        </div>
    </div>
}