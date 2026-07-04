const SUPABASE_URL = "https://xmrkbpnslyuxkcgxcoxc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtcmticG5zbHl1eGtjZ3hjb3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMDg2NTYsImV4cCI6MjA5NzU4NDY1Nn0.tCHkFovr-SQFIsMl1f64lZP8jWJWUtOIor6jMDa_558";

// Initialize client
export const supa = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

async function checkSession() {

    const { data, error } = await supa.auth.getSession();

    if (error) {
        console.error(error);
        return false;
    }

    return data.session !== null;
}
export async function requireAuth() {
    const { data, error } = await supa.auth.getSession();

    // Default role
    document.body.classList.add("level-1");
    document.body.classList.remove("level-2", "level-3");
    const currentPage = window.location.pathname
    const loggedInUser = document.getElementById("loggedInUser");
    const guestUser = document.getElementById("guestUser");

    if (error || !data.session) {

        // Only protect these pages
        const protectedPages = ["blotter.html", "files.html"];

        if (protectedPages.includes(currentPage)) {
            window.location.replace("index.html");
            return false;
        }

        // Public pages stay as Level 1
        loggedInUser.style.display = "none";
        guestUser.style.display = "flex";
        document.body.classList.add("ready");

        return true;
    }

    const user = data.session.user;

    const welcomeText = document.getElementById("welcomeText");
    loggedInUser.style.display = "flex";
    guestUser.style.display = "none";
    if (welcomeText) {
        welcomeText.textContent = `Welcome, ${user.email}`;
    }



    // Get user's level
    const { data: profile } = await supa
        .from("usersdata")
        .select("userrole")
        .eq("id", user.id)
        .single();

    document.body.classList.remove("level-1", "level-2", "level-3");

    if (profile.userrole === "Level 2") {
        document.body.classList.add("level-2");
    } else if (profile.userrole === "Level 3") {
        document.body.classList.add("level-3");
    } else {
        document.body.classList.add("level-1");
    }

    document.body.classList.add("ready");
    return true;
}

async function checkUserData() {

    const { data: sessionData } = await supa.auth.getSession();

    if (!sessionData.session) {
        return false;
    }

    const user = sessionData.session.user;

    const { data: profile, error } = await supa
        .from("usersdata")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error(error);
        return false;
    }

    if (!profile) {
        await supa.auth.signOut();
    }

}

await checkUserData()