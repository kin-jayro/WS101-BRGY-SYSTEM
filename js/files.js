import { supa, requireAuth } from "./supabase.js";

const fileListBody = document.getElementById('file_list_body'); // The list that files and folders will be added to
async function init() {
    await requireAuth()
}

const dropdownFileMenu = document.getElementById('fileDropdownMenu');

init()

const folderModal = document.getElementById('folderModal');
const fileModal = document.getElementById('fileModal');

const folderNameInput = document.getElementById('folderNameInput');

const fileBack = document.getElementById('return_to_previous_folder');

let activeFolderIdList = [];


function openFolderModal() {
    folderNameInput.value = '';
    folderModal.showModal();
}

function closeFolderModal() {
    folderModal.close();
}

function openFileModal() {
    fileModal.showModal();
}

function closeFileModal() {
    fileModal.close();
}

document.getElementById("upload_btn").addEventListener("click", () => {
    openFileModal()
});

document.getElementById("cancelUpload").addEventListener("click", () => {
    closeFileModal()
});

document.getElementById("create_folder_btn").addEventListener("click", () => {
    openFolderModal()
});

document.getElementById("cancelCreateFolder").addEventListener("click", () => {
    closeFolderModal()
});

async function loadFiles() {
    let data, error;
    fileListBody.innerHTML = ""

    if (activeFolderIdList.length === 0) {
        fileBack.style.display = "none";

        ({ data, error } = await supa
            .from("user_files")
            .select(`
                file_id,
                file_name,
                type,
                modified_at,
                usersdata (
                    email
                )
            `)
            .is("origins_from_folder", null)
            .order("modified_at", { ascending: false }));

    } else {
        fileBack.style.display = "inline-block";

        const lastItem = activeFolderIdList.at(-1);

        ({ data, error } = await supa
            .from("user_files")
            .select(`
                file_id,
                file_name,
                type,
                modified_at,
                usersdata (
                    email
                )
            `)
            .eq("origins_from_folder", lastItem)
            .order("modified_at", { ascending: false }));
    }

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(file => {
        const icon = file.type === "Folder" ? "📁" : "📄";
        const displayEmail = file.usersdata?.email ?? "Unknown";

        fileListBody.innerHTML += `
                    <div class="file-row"data-id="${file.file_id}"
                    data-email="${displayEmail}"
                    data-type="${file.type}">
                    
                    <div class="file-name-col">
                <span>${icon}</span>
                <span>${file.file_name}</span>
            </div>

                    <div>
                        ${new Date(file.modified_at).toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })}
                    </div>

                    <div class="action-btn-container">
                        <button class="action-btn">⋮</button>
                    </div>
                </div>
            </div>
        `;
    });
}

async function uploadFileFolder(type) {

    const {
        data: { session },
    } = await supa.auth.getSession();

    if (!session) {
        alert("You must be logged in.");
        return;
    }

    const user = session.user;
    const currentFolder = activeFolderIdList.at(-1) ?? null;

    // ================= CREATE FOLDER =================
    if (type === "Folder") {

        const folderName = document
            .getElementById("folderNameInput")
            .value
            .trim();

        if (!folderName) {
            alert("Please enter a folder name.");
            return;
        }

        const { error } = await supa
            .from("user_files")
            .insert({
                file_name: folderName,
                type: "Folder",
                origins_from_folder: currentFolder,
                uploader_id: user.id,
                delete_status: "Active"
            });

        if (error) {
            console.error(error);
            alert(error.message);
            return;
        }

        document.getElementById("folderNameInput").value = "";
        closeFolderModal();
        await loadFiles();

        alert("Folder created successfully!");
        return;
    }

    // ================= UPLOAD FILE =================
    if (type !== "File") return;

    const file = document.getElementById("fileInput").files[0];

    if (!file) {
        alert("Please select a file.");
        return;
    }

    const title =
        document.getElementById("fileTitleInput").value.trim() || file.name;

    const storagePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supa.storage
        .from("Barangay_Files")
        .upload(storagePath, file);

    if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        return;
    }

    const { error: dbError } = await supa
        .from("user_files")
        .insert({
            file_name: title,
            type: "File",
            origins_from_folder: currentFolder,
            storage_path: storagePath,
            uploader_id: user.id,
            delete_status: "Active",
        });

    if (dbError) {
        console.error(dbError);

        await supa.storage
            .from("Barangay_Files")
            .remove([storagePath]);

        alert(dbError.message);
        return;
    }

    document.getElementById("fileTitleInput").value = "";
    document.getElementById("fileDescriptionInput").value = "";
    document.getElementById("fileInput").value = "";

    closeFileModal();
    await loadFiles();

    alert("File uploaded successfully!");
}

document.getElementById("confirmUpload").addEventListener("click", () => {
    uploadFileFolder("File")
});

document.getElementById("confirmCreate").addEventListener("click", () => {
    uploadFileFolder("Folder")
});

document.addEventListener('click', function (event) {
    if (!event.target.closest('#fileDropdownMenu')) {
        dropdownFileMenu.classList.add('hidden');
    }
});

fileListBody.addEventListener("click", (event) => {
    const actionBtn = event.target.closest(".action-btn");

    if (actionBtn) {
        event.stopPropagation();

        const rect = actionBtn.getBoundingClientRect();

        dropdownFileMenu.style.top = `${rect.bottom + window.scrollY}px`;
        dropdownFileMenu.style.left = `${rect.left + window.scrollX - 100}px`;

        dropdownFileMenu.classList.remove("hidden");
    }
});

dropdownFileMenu.addEventListener('click', function (event) {
    const clickedItem = event.target.closest('.file-dropdown-item');
    if (!clickedItem) return;

    const action = clickedItem.dataset.action;


    if (action === 'download') {

    } else if (action === 'delete') {


    } else if (action === 'rename') {

    } else if (action === 'open') {

    }

    console.log(`User wants to ${action} file ID: ${activeFileId} ${activeFileLink}`);


    // Hide the menu after they make a selection
    dropdownFileMenu.classList.add('hidden');
});


fileBack.addEventListener("click", () => {
    if (!activeFolderIdList.length) return;

    activeFolderIdList.pop();
    loadFiles();
});

async function selectFileOrFolder(id) {
    const { data, error } = await supa
        .from("user_files")
        .select(`
            file_id,
            file_name,
            type,
            storage_path
        `)
        .eq("file_id", id)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    // Open folder
    if (data.type === "Folder") {
        activeFolderIdList.push(data.file_id);
        console.log(activeFolderIdList)
        await loadFiles();
        return;
    }

    // Open file
    const { data: fileBlob, error: downloadError } = await supa.storage
        .from("Barangay_Files")
        .download(data.storage_path);

    if (downloadError) {
        console.error(downloadError);
        alert("Unable to open file.");
        return;
    }

    const url = URL.createObjectURL(fileBlob);

    window.open(url, "_blank");

    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

fileListBody.addEventListener("click", (e) => {

    // Ignore clicks on the action button
    if (e.target.closest(".action-btn")) return;

    const row = e.target.closest(".file-row");
    if (!row) return;

    selectFileOrFolder(row.dataset.id);
});

await loadFiles();

