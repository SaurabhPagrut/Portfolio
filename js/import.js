import homesection from "../components/home.js";
import aboutsection from "../components/about.js";
import educationsection from "../components/education.js";
import skillssection from "../components/skills.js";
// import githubsection from "../components/github.js";
import contactsection from "../components/contact.js";
import footersection from "../components/footer.js";

const homesec = document.getElementById("home");
homesec.innerHTML = homesection();

const aboutsec = document.getElementById("about");
aboutsec.innerHTML = aboutsection();

const educationsec = document.getElementById("education");
educationsec.innerHTML = educationsection();

const skillssec = document.getElementById("skills");
skillssec.innerHTML = skillssection();

// const githubsec = document.getElementById("github");
// githubsec.innerHTML = githubsection();

const contactsec = document.getElementById("contact");
contactsec.innerHTML = contactsection();

const footersec = document.getElementById("footer");
footersec.innerHTML = footersection();