import { supa, requireAuth } from "./supabase.js";
let barangayId = null;
async function init() {
    await requireAuth();
    await loadBarangayInformation();
}

init();

async function loadBarangayInformation() {

    const { data, error } = await supa
        .from("barangay_information")
        .select("*")
        .maybeSingle();

    if (error) {
        console.error(error);
        return;
    }

    if (!data) return;

    barangayId = data.id;

    // Display page
    document.getElementById("displayBarangay").textContent = data.barangay_name;
    document.getElementById("displayMunicipality").textContent = data.municipality;
    document.getElementById("displayProvince").textContent = data.province;
    document.getElementById("displayPhone").textContent = data.phone_number;
    document.getElementById("displayEmail").textContent = data.email_address;

    if (data.logo_url) {
        document.getElementById("barangayLogo").src = data.logo_url;
        document.getElementById("logoPreview").src = data.logo_url;
    }

    // Fill modal form
    document.getElementById("barangayName").value = data.barangay_name;
    document.getElementById("municipality").value = data.municipality;
    document.getElementById("province").value = data.province;
    document.getElementById("phoneNumber").value = data.phone_number ?? "";
    document.getElementById("emailAddress").value = data.email_address ?? "";
}

const logoInput = document.getElementById("logoInput");

logoInput.addEventListener("change", () => {

    const file = logoInput.files[0];

    if (file) {
        logoPreview.src = URL.createObjectURL(file);
    }

});
async function uploadLogo() {

    const file = logoInput.files[0];

    if (!file) return null;

    const fileName = Date.now() + "-" + file.name;

    const { error } = await supa.storage
        .from("Officials_profile_images")
        .upload(fileName, file, {
            upsert: true
        });

    if (error) throw error;

    const { data } = supa.storage
        .from("Officials_profile_images")
        .getPublicUrl(fileName);

    return data.publicUrl;

}
const form = document.getElementById("barangayForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        let logoUrl = document.getElementById("logoPreview").src;

        if (logoInput.files.length > 0) {
            logoUrl = await uploadLogo();
        }

        const { error } = await supa
            .from("barangay_information")
            .update({

                barangay_name: document.getElementById("barangayName").value,

                municipality: document.getElementById("municipality").value,

                province: document.getElementById("province").value,

                phone_number: document.getElementById("phoneNumber").value,

                email_address: document.getElementById("emailAddress").value,

                logo_url: logoUrl,

                updated_at: new Date()

            })
            .eq("id", barangayId);

        if (error) throw error;

        alert("Barangay information updated successfully.");

        modal.classList.remove("show");

        await loadBarangayInformation();

    } catch (err) {

        console.error(err);

        alert(err.message);

    }

});
const modal = document.getElementById("updateModal");

document
    .getElementById("openUpdateModal")
    .onclick = () => {

        modal.classList.add("show");

    };

document
    .getElementById("closeModal")
    .onclick = () => {

        modal.classList.remove("show");

    };

document
    .getElementById("cancelModal")
    .onclick = () => {

        modal.classList.remove("show");

    };

window.onclick = (e) => {

    if (e.target === modal) {

        modal.classList.remove("show");

    }

};



