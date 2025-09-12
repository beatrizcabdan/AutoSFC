import React, {useEffect, useState} from "react";
import './Nav.scss'

interface NavProps {
    scrollPos: number,
    hideMobileNav: boolean
}

export function Nav({scrollPos, hideMobileNav}: NavProps) {
    const [navHeight, setNavHeight] = useState(0)

    useEffect(() => {
        const topnav = document.querySelector('.topnav') as HTMLElement
        const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const navHeight = topnav ? topnav.offsetHeight * 100 / h : -1
        setNavHeight(navHeight)
    }, []);

    function scrollToSection(section: string) {
        const element = document.querySelector(section)!
        const topPos = element.getBoundingClientRect().top + window.scrollY

        window.scrollTo({
            top: topPos,
            behavior: 'smooth'
        })
    }

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
        <div onClick={() => scrollToSection("#contact")}>
            <span className="material-symbols-outlined">alternate_email</span>Contact
        </div>
    </div>
}