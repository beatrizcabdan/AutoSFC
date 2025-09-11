import React from "react";
import './Nav.scss'
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";

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
            <ArrowUpwardIcon sx={{ mr: 1 }} />Encoding Demo</div>
        <div onClick={() => scrollToSection("#comp-demo-div")}>Comparison Demo</div>
        <div onClick={() => scrollToSection("#work")}>Previous work</div>
        <div onClick={() => scrollToSection("#about")}>About SFCs</div>
        <div onClick={() => scrollToSection("#contact")}>Contact</div>
    </div>
}