
let sections = ["Section1", "Section2"]

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

// const sidebar = document.getElementById("sidebar-tutorial");
// const hoverZone = document.getElementById("sidebarHoverZone");
//
// // Track if the sidebar is currently shown
// let isSidebarVisible = false;
//
// // Move sidebar to mouse Y only when hovering over the zone
// hoverZone.addEventListener("mousemove", (e) => {
//     if (!isSidebarVisible) {
//         sidebar.style.top = e.clientY + "px";
//     }
// });
//
// // Show sidebar when entering the zone
// hoverZone.addEventListener("mouseenter", () => {
//     sidebar.classList.remove('hidden');
//     isSidebarVisible = true;
// });
//
// // Hide sidebar when leaving the zone
// hoverZone.addEventListener("mouseleave", () => {
//     sidebar.classList.add('hidden');
//     isSidebarVisible = false;
// });
