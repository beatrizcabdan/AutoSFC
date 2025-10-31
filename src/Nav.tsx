import React, {useEffect, useState} from "react";
import './Nav.scss'

interface NavProps {
    scrollPos: number,
    hideMobileNav: boolean,
    contactVisibilityClassName?: string,
    onSectionClick: (sectionId: string) => void
}

function NavLink(props: {
    title: string,
    sectionId: string,
    onSectionClick: (sectionId: string) => void,
    className?: string | undefined
}) {
    return <a onClick={e => e.preventDefault()} href={props.sectionId}>
        <div className={`active ${props.className ?? ''}`} onClick={() => props.onSectionClick(props.sectionId)}>
            <span className="material-symbols-outlined">swap_horiz</span>{props.title}
        </div>
    </a>;
}

export function Nav({scrollPos, hideMobileNav, contactVisibilityClassName, onSectionClick}: NavProps) {
    const [navHeight, setNavHeight] = useState(0)

    useEffect(() => {
        const topnav = document.querySelector('.topnav') as HTMLElement
        const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const navHeight = topnav ? topnav.offsetHeight * 100 / h : -1
        setNavHeight(navHeight)
    }, []);

    return <div className={`topnav ${scrollPos < navHeight ? 'top-pos' : ''} ${hideMobileNav ? 'hide' : ''}`}>
        <NavLink sectionId={"#encoding-demo-div"} onSectionClick={onSectionClick} title={'Encoding Demo'}/>
        <NavLink sectionId={"#comp-demo-div"} onSectionClick={onSectionClick} title={'Comparison Demo'}/>
        <NavLink sectionId={"#work"} onSectionClick={onSectionClick} title={'Previous work'}/>
        <NavLink sectionId={"#about"} onSectionClick={onSectionClick} title={'About SFCs'}/>
        <NavLink className={contactVisibilityClassName} sectionId={"#contact"} onSectionClick={onSectionClick} title={'Contact'}/>
    </div>
}