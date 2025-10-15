import React, {useEffect, useState} from "react";
import './Nav.scss'
import {scrollToSection} from "./utils.ts";

interface NavProps {
    scrollPos: number,
    hideMobileNav: boolean,
    contactVisibilityClassName?: string
}

export function Nav({scrollPos, hideMobileNav, contactVisibilityClassName}: NavProps) {
    const [navHeight, setNavHeight] = useState(0)

    useEffect(() => {
        const topnav = document.querySelector('.topnav') as HTMLElement
        const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const navHeight = topnav ? topnav.offsetHeight * 100 / h : -1
        setNavHeight(navHeight)
    }, []);

    return <div className={`topnav ${scrollPos < navHeight ? 'top-pos' : ''} ${hideMobileNav ? 'hide' : ''}`}>
        <div className="active" onClick={() => scrollToSection("#encoding-demo-div")}>
            <span className="material-symbols-outlined">swap_horiz</span>Encoding Demo
        </div>
        <div onClick={() => scrollToSection("#comp-demo-div")}>
            <span className="material-symbols-outlined">barcode</span>Comparison Demo
        </div>
        <div onClick={() => scrollToSection("#work")}>
            <span className="material-symbols-outlined">article</span>Previous work
        </div>
        <div onClick={() => scrollToSection("#about")}>
            <span className="material-symbols-outlined">info</span>About SFCs
        </div>
        <div className={contactVisibilityClassName} onClick={() => scrollToSection("#contact")}>
            <span className={`material-symbols-outlined`}>alternate_email</span>Contact
        </div>
    </div>
}