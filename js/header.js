const authSidebar = document.getElementById("auth-sidebar");
const publicSidebar = document.getElementById("public-sidebar");

const menuBtn = document.getElementById("menuBtn");
const overlay = document.getElementById("overlay");

const loginBtn = document.querySelector(".login-btn");

if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        window.location.href = "login.html";
    });
}
// There are two close buttons now
const closeButtons = document.querySelectorAll(".close-btn");

function getActiveSidebar() {
    if (document.body.classList.contains("level-2") ||
        document.body.classList.contains("level-3")) {
        return authSidebar;
    }

    return publicSidebar;
}

function openSidebar() {
    const sidebar = getActiveSidebar();

    if (!sidebar) return;

    sidebar.classList.add("show");
    overlay.classList.add("show");
    menuBtn.classList.add("hide");
}

function closeSidebar() {
    if (authSidebar) authSidebar.classList.remove("show");
    if (publicSidebar) publicSidebar.classList.remove("show");

    overlay.classList.remove("show");
    menuBtn.classList.remove("hide");
}

menuBtn.addEventListener("click", openSidebar);

closeButtons.forEach(btn => {
    btn.addEventListener("click", closeSidebar);
});

overlay.addEventListener("click", closeSidebar);

window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
        closeSidebar();
    }
});