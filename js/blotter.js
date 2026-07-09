const modal = document.getElementById("blotterModal")
const blotterTable = document.getElementById("blotter-data")
const searchInput = document.getElementById("search");

let blotterData = [];

import { supa, requireAuth } from "./supabase.js";
document.getElementById("add-blotter-btn").onclick = () => {
    modal.classList.add("show")
};

document.getElementById("closeModal").onclick = () => {
    modal.classList.remove("show")
};

const fileInput = document.getElementById("blotterFiles");
const fileList = document.getElementById("selectedFilesList");

const selectedFiles = new DataTransfer();

fileInput.addEventListener("change", () => {
    // Add newly selected files
    for (const file of fileInput.files) {
        selectedFiles.items.add(file);
    }

    // Update the input's files
    fileInput.files = selectedFiles.files;

    renderFileList();
});

function renderFileList() {
    fileList.innerHTML = "";

    [...selectedFiles.files].forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "selected-file";

        item.innerHTML = `
            <div>
                📎 <strong>${file.name}</strong><br>
                <small>${(file.size / 1024).toFixed(1)} KB</small>
            </div>

            <button type="button" class="remove-file-btn" data-index="${index}">
                ✕ Remove
            </button>
        `;

        fileList.appendChild(item);
    });

    document.querySelectorAll(".remove-file-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            removeFile(Number(btn.dataset.index));
        });
    });
}

function removeFile(index) {
    const dt = new DataTransfer();

    [...selectedFiles.files].forEach((file, i) => {
        if (i !== index) {
            dt.items.add(file);
        }
    });

    // Replace the stored files
    selectedFiles.items.clear();

    [...dt.files].forEach(file => {
        selectedFiles.items.add(file);
    });

    fileInput.files = selectedFiles.files;

    renderFileList();
}


document.getElementById("cancelBtn").onclick = () => {
    modal.classList.remove("show")
};

window.onclick = (e) => {
    if (e.target === modal) {
        modal.classList.remove("show")
    }
};
requireAuth()

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
    await uploadBlotterFiles(blotter.blotter_id);

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

async function uploadBlotterFiles(blotterId) {

    const fileInput = document.getElementById("blotterFiles");

    if (fileInput.files.length === 0) return;

    // Check if folder already exists
    let { data: folder } = await supa
        .from("user_files")
        .select("file_id")
        .eq("blotter_id", blotterId)
        .eq("type", "Folder")
        .maybeSingle();

    // Create folder if it doesn't exist
    if (!folder) {

        const { data: newFolder, error } = await supa
            .from("user_files")
            .insert({
                file_name: `Blotter ${blotterId}`,
                type: "Folder",
                blotter_id: blotterId,
                uploader_id: (await supa.auth.getUser()).data.user.id
            })
            .select("file_id")
            .single();

        if (error) {
            console.error(error);
            return;
        }

        folder = newFolder;
    }

    const userId = (await supa.auth.getUser()).data.user.id;

    // Upload every file
    for (const file of fileInput.files) {

        const path = `Blotter/${blotterId}/${crypto.randomUUID()}-${file.name}`;

        const { data: uploadData, error: uploadError } = await supa.storage
            .from("Barangay_Files")
            .upload(path, file);

        if (uploadError) {
            console.error(uploadError);
            continue;
        }

        console.log(uploadData);
        console.log(uploadError);

        // Save the storage path to the database
        const { data, error } = await supa
            .from("user_files")
            .insert({
                file_name: file.name,
                type: "File",
                storage_path: path,
                origins_from_folder: folder.file_id,
                blotter_id: blotterId,
                uploader_id: userId
            })
            .select();

        console.log(data);
        console.log(error);

        if (error) {
            await supa.storage
                .from("Barangay_Files")
                .remove([path]);
        }
    }
}

async function retrieveBlotterData() {

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

    blotterData = data;
    renderTable(blotterData);
}

function renderTable(records) {

    let rows = "";

    records.forEach(record => {

        const complainantNames = record.complainant.length
            ? record.complainant.map(c => c.full_name).join(", ")
            : "None";

        rows += `
        <tr>
            <td>${record.blotter_id}</td>
            <td>${new Date(record.incident_date).toLocaleDateString("en-PH")}</td>
            <td>${complainantNames}</td>
            <td>${record.respondent_name}</td>
            <td>${record.incident_type}</td>
            <td>${record.status ?? "Pending"}</td>
            <td>
                <button
                    class="view-btn"
                    data-id="${record.blotter_id}">
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
        ),
        user_files (
    file_id,
    file_name,
    storage_path,
    type,
    modified_at
)
    `)
        .eq("blotter_id", id)
        .neq("user_files.type", "Folder")
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

    let attachments = "";

    if (data.user_files.length) {
        data.user_files.forEach(file => {
            attachments += `
            <div class="attachment-card">
                📎
                <a href="#" class="attachment-link"
                   data-path="${file.storage_path}">
                    ${file.file_name}
                </a>
            </div>
        `;
        });
    } else {
        attachments = "<p>No attachments.</p>";
    }

    content.innerHTML = `
<h3>📄 Blotter Information</h3>
<p><b>Date:</b> ${data.incident_date}</p>
<p><b>Time:</b> ${data.incident_time}</p>
<p><b>Location:</b> ${data.incident_location}</p>
<p><b>Type:</b> ${data.incident_type}</p>
<p>
    <b>Status:</b>
    <select id="blotterStatus">
        <option value="Pending" ${data.status === "Pending" ? "selected" : ""}>Pending</option>
        <option value="Ongoing" ${data.status === "Ongoing" ? "selected" : ""}>Ongoing</option>
        <option value="Resolved" ${data.status === "Resolved" ? "selected" : ""}>Resolved</option>
        <option value="Dismissed" ${data.status === "Dismissed" ? "selected" : ""}>Dismissed</option>
    </select>

    <button id="saveStatusBtn">Save</button>
</p>
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
<hr>
<h3>📎 Attachments</h3>
${attachments}
`;

document.getElementById("saveStatusBtn").addEventListener("click", async () => {

    const status = document.getElementById("blotterStatus").value;

    const { error } = await supa
        .from("blotter")
        .update({ status })
        .eq("blotter_id", data.blotter_id);

    if (error) {
        console.error(error);
        alert("Failed to update status.");
        return;
    }

    alert("Status updated successfully.");
});

    document.getElementById("viewModal").classList.add("show");
    document.querySelectorAll(".attachment-link").forEach(link => {
        link.addEventListener("click", async (e) => {
            e.preventDefault();

            const path = link.dataset.path;

            const { data, error } = await supa.storage
                .from("Barangay_Files") // your bucket name
                .download(path);

            if (error) {
                console.error(error);
                alert("Unable to open attachment.");
                return;
            }

            const blobUrl = URL.createObjectURL(data);

            // Open in new tab
            window.open(blobUrl, "_blank");

            // Clean up later
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        });
    });
}

async function init() {

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

searchInput.addEventListener("input", () => {

    const search = searchInput.value.toLowerCase().trim();

    const filtered = blotterData.filter(record => {

        const complainantNames = record.complainant.length
            ? record.complainant.map(c => c.full_name).join(" ")
            : "";

        return [
            record.blotter_id,
            record.incident_date,
            complainantNames,
            record.respondent_name,
            record.incident_type,
            record.status
        ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

    renderTable(filtered);
});