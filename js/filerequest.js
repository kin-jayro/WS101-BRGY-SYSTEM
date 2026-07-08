import { supa, requireAuth } from "./supabase.js";
async function init() {
    await requireAuth()
}

init()

const documentIds = {
    "Barangay Clearance": 1,
    "Certificate of Residency": 2,
    "Certificate of Indigency": 3,
    "Business Permit Clearance": 4,
    "First Time Job Seeker Certificate": 5
};


const form = document.getElementById("requestForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const {
        data: { user }
    } = await supa.auth.getUser();

    if (!user) {

        alert("Please login first.");
        return;
    }

    const num = document.getElementById("contactNumber").value.trim()

    const documentName =
        document.getElementById("documentType").value;

    const purpose =
        document.getElementById("purpose").value.trim();

    const remarks =
        document.getElementById("remarks").value.trim();

    const documentId = documentIds[documentName];

    const file = document.getElementById("supportingDocuments").files[0];

    let filePath = null;

    if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supa.storage
            .from("supporting-documents")
            .upload(filePath, file);

        if (uploadError) {
            alert(uploadError.message);
            return;
        }
    }

    const { data: file_requests, error } = await supa
        .from("file_requests")
        .insert({
            user_id: user.id,
            document_type: documentName,
            purpose,
            remarks,
            number: num,
            files_path: filePath ? [filePath] : [],
            notes: document.getElementById("remarks").value.trim()
        })
        .select()
        .single();

    if (!error) {
form.reset();
    }

    alert("Request submitted successfully!");
    
});