
let sections = ["Section1", "Section2", "Section3", "Section4", "Section5", "Section6", "Section7", "Section8", "Section9", "Section10"];

function showSection(name) {
    if (!sections.includes(name)) {
        return;
    }

    for (let id = 0; id < sections.length; id++) {
        const element = document.getElementById(sections[id]);
        if (name === sections[id]) {
            element.classList.remove("hidden");
        } else {
            element.classList.add("hidden");
        }
    }
}