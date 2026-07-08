import { supa } from "./supabase.js";

const form = document.getElementById("signup-form");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {

        alert("Passwords do not match.");
        return;
    }

    const { data, error } = await supa.auth.signUp({

        email,
        password,
        options: {
            emailRedirectTo: "http://localhost:5500/login.html"
        }

    });

    if (error) {

        alert(error.message);
        return;
    }

    const user = data.user;

    alert("Registration successful. Please verify your email.");

    window.location.href = "login.html";

});