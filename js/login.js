
async function signInWithEmail() {

    const { data, error } = await supa.auth.signInWithPassword({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
    });

    if (error) {
        alert(error.message);
        return;
    }

    const { data: profile, error: profileError } = await supa
        .from("usersdata")
        .select("userrole")
        .eq("id", data.user.id)
        .single();

    if (profileError) {
        alert(profileError.message);
        return;
    }

    console.log(profile.userrole);

    window.location.href = "index.html";
}


document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent page reload
    await signInWithEmail();
});

