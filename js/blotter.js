const modal = document.getElementById("blotterModal")
const blotterTable = document.getElementById("blotter-data")
import { supa, requireAuth } from "./supabase.js";
document.getElementById("add-blotter-btn").onclick = () => {
    modal.classList.add("show")
};

document.getElementById("closeModal").onclick = () => {
    modal.classList.remove("show")
};


document.getElementById("cancelBtn").onclick = () => {
    modal.classList.remove("show")
};

window.onclick = (e) => {
    if (e.target === modal) {
        modal.classList.remove("show")
    }
};


const container = document.getElementById("complainantContainer");
const addBtn = document.getElementById("addComplainant");

addBtn.addEventListener("click", () => {

    const div = document.createElement("div");

    div.className = "complainant-item";

    div.innerHTML = `
        <hr>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h4>Additional Complainant</h4>

            <button type="button" class="removeComplainant">
                − Remove
            </button>
        </div>

        <div class="grid">

            <div>
                <label>Full Name <span class="required">*</span></label>
                <input type="text" name="complainant_name[]" required>
            </div>

            <div>
                <label>Age <span class="required">*</span></label>
                <input type="number" name="complainant_age[]" min="1" max="120" required>
            </div>

            <div>
                <label>Sex <span class="required">*</span></label>
                <select name="complainant_sex[]" required>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                </select>
            </div>

            <div>
                <label>Contact Number</label>
                <input type="tel"
                       name="complainant_contact[]"
                       pattern="[0-9]{11}"
                       placeholder="09XXXXXXXXX">
            </div>

            <div class="full">
                <label>Address <span class="required">*</span></label>
                <input type="text" name="complainant_address[]" required>
            </div>

        </div>
    `;

    container.appendChild(div);

});

container.addEventListener("click", function (e) {

    if (e.target.classList.contains("removeComplainant")) {
        e.target.closest(".complainant-item").remove();
    }

});

async function insertBlotter() {

    const respondent_name = document.getElementById("respondent_name").value;
    const incident_type = document.getElementById("incident_type").value;
    const incident_date = document.getElementById("incident_date").value;
    const incident_time = document.getElementById("incident_time").value;
    const incident_location = document.getElementById("incident_location").value;
    const incident_description = document.getElementById("incident_description").value;

    const { data: blotter, error } = await supa
        .from("blotter")
        .insert({
            respondent_name,
            incident_type,
            incident_date,
            incident_time,
            incident_location,
            incident_description
        })
        .select()
        .single();

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    await insertComplainants(blotter.blotter_id);

    alert("Blotter saved!");

    modal.classList.remove("show");

}

async function insertComplainants(blotterId) {

    const names = document.getElementsByName("complainant_name[]");
    const ages = document.getElementsByName("complainant_age[]");
    const sexes = document.getElementsByName("complainant_sex[]");
    const contacts = document.getElementsByName("complainant_contact[]");
    const addresses = document.getElementsByName("complainant_address[]");

    const complainants = [];

    for (let i = 0; i < names.length; i++) {

        complainants.push({
            blotter_id: blotterId,
            full_name: names[i].value,
            age: Number(ages[i].value),
            sex: sexes[i].value,
            contact_number: contacts[i].value,
            address: addresses[i].value
        });

    }

    const { error } = await supa
        .from("complainant")
        .insert(complainants);

    if (error) {
        console.error(error);
        alert(error.message);
    }

}

async function retrieveBlotterData() {

    blotterTable.innerHTML = "";

    const { data, error } = await supa
        .from("blotter")
        .select(`
            *,
            complainant (
                complainant_id,
                full_name
            )
        `)
        .order("incident_date", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    let rows = "";

    data.forEach(record => {

        const complainantNames = record.complainant
            .map(c => c.full_name)
            .join(", ");

        rows += `
        <tr>
            <td>${record.blotter_id}</td>
            <td>${record.incident_date}</td>
            <td>${complainantNames}</td>
            <td>${record.respondent_name}</td>
            <td>${record.incident_type}</td>
            <td>${record.status ?? "Pending"}</td>
            <td>
                <button
                    class="view-btn"
                    data-id="${record.blotter_id}">">
                    View
                </button>
            </td>
        </tr>
        `;
    });

    blotterTable.innerHTML = rows;
}

async function viewBlotter(id) {

    const { data, error } = await supa
        .from("blotter")
        .select(`
            *,
            complainant (
                *
            )
        `)
        .eq("blotter_id", id)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    console.log(data);
    const content = document.getElementById("viewContent");

    let complainants = "";

    data.complainant.forEach(c => {

        complainants += `
        <div class="complainant-card">
            <h4>${c.full_name}</h4>
            <p><b>Age:</b> ${c.age}</p>
            <p><b>Sex:</b> ${c.sex}</p>
            <p><b>Contact:</b> ${c.contact_number}</p>
            <p><b>Address:</b> ${c.address}</p>
        </div>
    `;

    });

    content.innerHTML = `
<h3>📄 Blotter Information</h3>
<p><b>Date:</b> ${data.incident_date}</p>
<p><b>Time:</b> ${data.incident_time}</p>
<p><b>Location:</b> ${data.incident_location}</p>
<p><b>Type:</b> ${data.incident_type}</p>
<p><b>Description:</b></p>
<div class="description-box">
${data.incident_description}
</div>
<hr>
<h3>👤 Complainants</h3>
${complainants}
<hr>
<h3>👥 Respondent</h3>
<p>${data.respondent_name}</p>

`;

    document.getElementById("viewModal").classList.add("show");
}

async function init() {
    await requireAuth()
    await retrieveBlotterData()
}

init()

const blotterChannel = supa
    .channel("blotter-changes")
    .on(
        "postgres_changes",
        {
            event: "*", // INSERT, UPDATE, DELETE
            schema: "public",
            table: "blotter",
        },
        (payload) => {
            console.log("Blotter changed:", payload);

            retrieveBlotterData();
        }
    )
    .subscribe();

document
    .getElementById("blotterForm")
    .addEventListener("submit", async (e) => {

        e.preventDefault();

        await insertBlotter();

    })

blotterTable.addEventListener("click", (e) => {

    if (!e.target.classList.contains("view-btn")) return;

    const id = e.target.dataset.id;

    viewBlotter(id);

});

const closeViewModal = document.getElementById("closeViewModal");

// Close button
closeViewModal.addEventListener("click", () => {
    viewModal.classList.remove("show");
});

// Click outside the modal to close
window.addEventListener("click", (e) => {
    if (e.target === viewModal) {
        viewModal.classList.remove("show");
    }
});