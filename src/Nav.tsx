import React from "react";

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
        <div className="active" onClick={() => scrollToSection("#encoding-demo-div")}>Encoding Demo</div>
        <div onClick={() => scrollToSection("#comp-demo-div")}>Comparison Demo</div>
        <div onClick={() => scrollToSection("#work")}>Previous work</div>
        <div onClick={() => scrollToSection("#about")}>About SFCs</div>
        <div onClick={() => scrollToSection("#contact")}>Contact</div>
    </div>
}