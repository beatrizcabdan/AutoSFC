import React from "react";
import './Nav.scss'

export function Nav() {
    function scrollToSection(section: string) {
        const element = document.querySelector(section)!
        const topPos = element.getBoundingClientRect().top + window.scrollY

        window.scrollTo({
            top: topPos,
            behavior: 'smooth'
        })
    }

    return <div className="topnav">
        <div className="active" onClick={() => scrollToSection("#encoding-demo-div")}>
            <span className="material-symbols-outlined">swap_horiz</span>Encoding Demo</div>
        <div onClick={() => scrollToSection("#comp-demo-div")}>
            <span className="material-symbols-outlined">barcode</span>Comparison Demo
        </div>
        <div onClick={() => scrollToSection("#work")}>
            <span className="material-symbols-outlined">article</span>Previous work</div>
        <div onClick={() => scrollToSection("#about")}>
            <span className="material-symbols-outlined">info</span>About SFCs</div>
        <div onClick={() => scrollToSection("#contact")}>
            <span className="material-symbols-outlined">alternate_email</span>Contact</div>
    </div>
}