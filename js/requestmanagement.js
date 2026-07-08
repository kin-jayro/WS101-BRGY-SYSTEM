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

        ${
            request.status === "Pending"
                ? `
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
                `
                : ""
        }

<button
    class="email-btn"
    onclick="openEmailModal(
        '${request.usersdata.email}',
        '${request.request_id}',
        '${request.document_type}',
        '${new Date(request.requested_at).toLocaleDateString()}'
    )">
    📧 Email
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

    const { error: functionError } = await supa.functions.invoke(
        "send-approved-or-rejected",
        {
            body: {
                requestId: id
            }
        }
    );

    if (functionError) {
        console.error(functionError);
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

    const { error: functionError } = await supa.functions.invoke(
        "send-approved-or-rejected",
        {
            body: {
                requestId: id
            }
        }
    );

    if (functionError) {
        console.error(functionError);
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

const emailModal = document.getElementById("emailModal");

const closeModalBtn = document.querySelector(".close-modal");

window.openEmailModal = (
    email,
    requestId,
    documentType,
    requestedDate
) => {

    document.getElementById("recipientEmail").value = email;

    document.getElementById("requestId").value = requestId;

    document.getElementById("emailSubject").value =
        `${documentType} - Requested ${requestedDate}`;

    document.getElementById("emailMessage").value = "";

    emailModal.classList.add("show");

};

closeModalBtn.onclick = () => {

    emailModal.classList.remove("show");

};

window.onclick = (e) => {

    if (e.target === emailModal) {

        emailModal.classList.remove("show");

    }

};

document.getElementById("sendEmailBtn").onclick = async () => {

    const email = document.getElementById("recipientEmail").value;
    const subject = document.getElementById("emailSubject").value.trim();
    const message = document.getElementById("emailMessage").value.trim();

    if (!subject || !message) {
        alert("Please complete the subject and message.");
        return;
    }

    const { error } = await supa.functions.invoke(
        "send-email",
        {
            body: {
                email,
                subject,
                message
            }
        }
    );

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    alert("Email sent successfully.");

    emailModal.classList.remove("show");

    document.getElementById("emailSubject").value = "";
    document.getElementById("emailMessage").value = "";
};