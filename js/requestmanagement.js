import { supa, requireAuth } from "./supabase.js";

await requireAuth()
const tbody = document.getElementById("requestTableBody");

loadRequests();

async function loadRequests() {

    const { data, error } = await supa
        .from("file_requests")
        .select(`
        *,
        usersdata(
            email
        )
    `)
        .order("requested_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    tbody.innerHTML = "";

    data.forEach(request => {

        let attachmentHTML = "";

        if (request.files_path?.length) {

            attachmentHTML = request.files_path.map(path => `

                <button
                    class="view-btn"
                    onclick="viewFile('${path}')">
                    View
                </button>

            `).join("<br>");

        } else {

            attachmentHTML = "None";

        }

        tbody.innerHTML += `

        <tr>

            <td>${request.usersdata.email}</td>

            <td>${request.document_type}</td>

            <td>${request.purpose}</td>

            <td>${new Date(request.requested_at).toLocaleDateString()}</td>

            <td>

                <span class="status ${request.status.toLowerCase().replaceAll(" ", "-")}">

                    ${request.status}

                </span>

            </td>

            <td>

                ${attachmentHTML}

            </td>

            <td>

                ${request.notes}

            </td>

            <td>

                <div class="actions">

                    <button
                    class="approve-btn"
                    onclick="approveRequest('${request.request_id}')">

                    Approve

                    </button>

                    <button
                    class="reject-btn"
                    onclick="rejectRequest('${request.request_id}')">

                    Reject

                    </button>

                </div>

            </td>

        </tr>

        `;

    });

}

window.approveRequest = async (id) => {

    const { error } = await supa
        .from("file_requests")
        .update({
            status: "Approved",
            approved_at: new Date().toISOString()
        })
        .eq("request_id", id);

    if (error) {

        alert(error.message);
        return;

    }

    loadRequests();

}

window.rejectRequest = async (id) => {

    const reason = prompt("Reason for rejection:");

    if (reason === null) return;

    const { error } = await supa
        .from("file_requests")
        .update({
            status: "Rejected",
            remarks: reason
        })
        .eq("request_id", id);

    if (error) {

        alert(error.message);
        return;

    }

    loadRequests();

}

window.viewFile = async (path) => {

    const { data, error } = await supa.storage
        .from("supporting-documents")
        .createSignedUrl(path, 60);

    if (error) {

        alert(error.message);
        return;

    }

    window.open(data.signedUrl, "_blank");

}