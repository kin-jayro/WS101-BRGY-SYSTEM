import { supa, requireAuth} from "./supabase.js";

async function init() {
    await requireAuth()
}

init()
async function loadOfficials() {

    const { data, error } = await supa
        .from("barangay_official")
        .select("*");

    if (error) {
        console.error(error);
        return;
    }

    const container = document.getElementById("officialsContainer");
    container.innerHTML = "";

    const mayor = data.find(o => o.role === "Mayor");
    const activeOfficials = data.filter(
        o => o.role !== "Mayor" && o.status === "Active"
    );
    const inactiveOfficials = data.filter(
        o => o.role !== "Mayor" && o.status !== "Active"
    );

    const colors = [
        "color-red",
        "color-blue",
        "color-teal",
        "color-gray"
    ];

    function createSection(title, officials) {

        if (officials.length === 0) return "";

        let html = `
            <section class="official-section">
                <h2 class="section-title">${title}</h2>

                <div class="officials-grid">
        `;

        officials.forEach((official, index) => {

            const statusClass =
                official.status === "Active"
                    ? "dot-green"
                    : "dot-red";

            const image =
                official.profile_image || "images/default-user.png";

            html += `
                <div class="official-card ${colors[index % colors.length]}">

                    <div class="card-header">
                        <h3>${official.first_name} ${official.last_name}</h3>
                        <p class="role-text">${official.role}</p>
                    </div>

                    <div class="card-body">

                        <div class="avatar-container">
                            <img src="${image}">
                        </div>

                        <div class="card-actions">

                            <div>
                                <span class="dot ${statusClass}"></span>
                                ${official.status}
                            </div>

                            <div>
                                <strong>${official.age}</strong><br>
                                Age
                            </div>

                            <div>
                                <button class="view-btn" data-id="${official.official_id}">
                                    👁
                                </button>
                                <br>
                                View
                            </div>

                        </div>

                    </div>

                </div>
            `;
        });

        html += `
                </div>
            </section>
        `;

        return html;
    }

    if (mayor) {
        container.innerHTML += createSection("Mayor", [mayor]);
    }

    container.innerHTML += createSection("Active Officials", activeOfficials);

    container.innerHTML += createSection("Inactive Officials", inactiveOfficials);
}



async function viewOfficial(id) {

    const { data, error } = await supa
        .from("barangay_official")
        .select("*")
        .eq("official_id", id)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    modalImage.src = data.profile_image || "images/default-user.png";
    modalName.textContent = `${data.first_name} ${data.middle_name ?? ""} ${data.last_name}`;
    modalRole.textContent = data.role;

    modalAge.textContent = data.age;
    modalGender.textContent = data.gender;
    modalCivil.textContent = data.civil_status;
    modalBirth.textContent = data.birth_date;
    modalContact.textContent = data.contact_number;
    modalEmail.textContent = data.email;

    modalFacebook.href = data.facebook_url;
    modalFacebook.textContent = "Open Facebook";

    modalTerm.textContent =
        `${data.term_start} - ${data.term_end}`;

    modalStatus.textContent = data.status;

    document.getElementById("officialModal").classList.add("active");
}

document.querySelector(".close-modal").onclick = () => {
    document.getElementById("officialModal").classList.remove("active");
};

window.onclick = (e) => {
    if (e.target.id === "officialModal") {
        document.getElementById("officialModal").classList.remove("active");
    }
};
loadOfficials().then(() => {

    document.querySelectorAll(".view-btn").forEach(button => {

        button.addEventListener("click", () => {
            viewOfficial(button.dataset.id);
        });

    });

});
