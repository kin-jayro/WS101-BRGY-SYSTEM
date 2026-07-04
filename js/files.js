import { supa, requireAuth } from "./supabase.js";

const fileListBody = document.getElementById('file_list_body'); // The list that files and folders will be added to
async function init() {
    await requireAuth()
}

init()

async function loadFilesInFolder() {
    fileListBody.innerHTML = '';
    let query = null;
    const currentFolderId = activeFolderId.at(-1);
    if (activeFolderId.length === 0) {
        fileBack.classList.add('hidden');
        if (currentUserRole === 'User') {
            query = await supabaseClient
                .from('user_files')
                .select('*')
                .eq('owner_id', currentID)
                .is('origins_from_folder', null)
                .is('delete_status', null);
        } else {
            query = await supabaseClient
                .from('user_files')
                .select('*')
                .is('origins_from_folder', null)
                .is('delete_status', null);
        }
    } else {
        fileBack.classList.remove('hidden');
        query = await supabaseClient
            .from('user_files')
            .select('*')
            .eq('origins_from_folder', currentFolderId)
            .is('delete_status', null);

        if (currentUserEmail !== ownerEmail && currentUserRole === 'Staff') {
            createFolder.classList.add('disabled');
            uploadFile.classList.add('disabled');
            return;
        }
    }

    fileListBody.innerHTML = 'Loading Files...'

    const { data: filesData, error: filesError } = query;

    if (filesError) {
        console.log(filesError)
    }
    if (filesData == null || filesData.length == 0) {
        fileListBody.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No Files Found.</div>';
        return;
    } else {
        fileListBody.innerHTML = ''
        filesData.sort((a, b) => {
            // 1. Folders first
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;

            // 2. Same type → sort by name
            return a.file_name.localeCompare(b.file_name);
        });
        filesData.forEach(file => {
            const isoDate = file.modified_at;
            let displayEmail = file.owner_email;
            if(file.owner_email === currentUserEmail) {
                displayEmail = `${file.owner_email} (You)`;
            }

            const formatted = new Date(isoDate).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });
            let icon = '📄';
            if (file.type === 'folder') icon = '📁';
            if (file.type === 'image') icon = '🖼️';

            const fileHTML = `
            <div class="file-row" data-id="${file.file_id}" data-email="${file.owner_email}" data-type ="${file.type}">
                <div class="file-name-col">
                    <span>${icon}</span>
                    <span>${file.file_name}</span>
                </div>
                <div>${displayEmail}</div>
                <div>${formatted}</div>
        
                <div class="action-btn-container">
                    <button class="action-btn menu-btn">⋮</button>
                </div>
            </div>
        `;

            fileListBody.insertAdjacentHTML('beforeend', fileHTML);
        });
    }
}