import { supa, requireAuth } from "./supabase.js";
async function init() {
    await requireAuth()
}

init()


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

    const documentName =
        document.getElementById("documentType").value;

    const purpose =
        document.getElementById("purpose").value.trim();

    const remarks =
        document.getElementById("remarks").value.trim();

    const documentId = documentIds[documentName];

    const { data: request, error } = await supa
        .from("file_requests")
        .insert({

            user_id: user.id,
            document_id: documentId,
            purpose: purpose,
            remarks: remarks

        })
        .select()
        .single();

    if (error) {

        console.error(error);
        alert(error.message);
        return;
    }

    alert("Request submitted successfully!");

});