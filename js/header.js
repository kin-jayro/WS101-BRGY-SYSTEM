import { supa } from "./supabase.js";

const authSidebar = document.getElementById("auth-sidebar");
const publicSidebar = document.getElementById("public-sidebar");

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {

    const { error } = await supa.auth.signOut();

    if (error) {
        alert(error.message);
        return;
    }

    window.location.href = "landing.html";

});
const menuBtn = document.getElementById("menuBtn");
const overlay = document.getElementById("overlay");

const loginBtn = document.querySelector(".login-btn");

const barangayLogo = document.getElementById("barangay-logo");

loadBarangayInfo();

async function loadBarangayInfo() {

    const { data, error } = await supa
        .from("barangay_information")
        .select("logo_url")
        .limit(1)
        .single();

    if (error) {
        console.error("Failed to load barangay information:", error);
        return;
    }

    if (data?.logo_url && barangayLogo) {
        barangayLogo.src = data.logo_url;
    }

}

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

