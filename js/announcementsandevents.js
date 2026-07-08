import { supa, requireAuth } from "./supabase.js";
async function init() {
    await requireAuth()
}

init()

const modal = document.getElementById("postModal");

const openBtn = document.getElementById("addPostBtn");
const closeBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelPost");
const attachmentInput = document.getElementById("attachments");
const attachmentLabel = document.getElementById("attachmentLabel");
const attachmentHint = document.getElementById("attachmentHint");
const selectedFiles = document.getElementById("selectedFiles");

const form = document.getElementById("postForm");

const postType = document.getElementById("postType");

const eventFields = document.getElementById("eventFields");
const authorGroup = document.getElementById("authorGroup");
const contentGroup = document.getElementById("contentGroup");

const postsGridList = document.getElementById("postsGridList");

const readModal = document.getElementById("readModal");

document.getElementById("closeReadModal").addEventListener("click", closeReadModal);
document.getElementById("closeReadBtn").addEventListener("click", closeReadModal);

readModal.addEventListener("click", (e) => {
    if (e.target === readModal) {
        closeReadModal();
    }
});

function closeReadModal() {
    readModal.classList.remove("show");
}

loadPosts();

async function loadPosts() {

    postsGridList.innerHTML = "";

    const [
        announcementsResult,
        newsResult,
        eventsResult
    ] = await Promise.all([

        supa
            .from("announcements")
            .select("*")
            .neq("status", "Archived"),

        supa
            .from("news")
            .select("*")
            .neq("status", "Archived"),

        supa
            .from("events")
            .select("*")
            .neq("status", "Cancelled")

    ]);

    const announcements = (announcementsResult.data || []).map(item => ({
        type: "announcement",
        id: item.announcement_id,
        title: item.title,
        content: item.content,
        date: item.publish_date,
        footer: formatDate(item.publish_date)
    }));

    const news = (newsResult.data || []).map(item => ({
        type: "news",
        id: item.news_id,
        title: item.title,
        content: item.content,
        date: item.publish_date,
        footer: formatDate(item.publish_date)
    }));

    const events = (eventsResult.data || []).map(item => ({
        type: "event",
        id: item.event_id,
        title: item.title,
        content: item.description,
        date: item.event_date,
        footer: `📍 ${item.location || "Barangay Hall"}`
    }));

    const posts = [
        ...announcements,
        ...news,
        ...events
    ];

    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderPosts(posts);

}

function renderPosts(posts) {

    postsGridList.innerHTML = "";

    posts.forEach(post => {

        let tagClass = "";
        let tagText = "";
        let buttonText = "Read More";

        switch (post.type) {

            case "announcement":
                tagClass = "announcement-tag";
                tagText = "📢 Announcement";
                break;

            case "news":
                tagClass = "news-tag";
                tagText = "📰 News";
                break;

            case "event":
                tagClass = "event-tag";
                tagText = "📅 Event";
                buttonText = "Details";
                break;

        }

        postsGridList.innerHTML += `

            <div class="post-card ${post.type}">

                <div class="post-type ${tagClass}">
                    ${tagText}
                </div>

                <h3>${post.title}</h3>

                <p>
                    ${truncate(post.content, 50)}
                </p>

                <div class="post-footer">

                    <span>${post.footer}</span>

                    <button
                        class="read-btn"
                        data-type="${post.type}"
                        data-id="${post.id}"
                    >
                        ${buttonText}
                    </button>

                </div>

            </div>

        `;

        postsGridList.addEventListener("click", async (e) => {

            const btn = e.target.closest(".read-btn");

            if (!btn) return;

            const id = btn.dataset.id;

            const type = btn.dataset.type;

            await openPost(type, id);

        });

    });

}

function truncate(text, length) {

    if (!text) return "";

    return text.length > length
        ? text.substring(0, length) + "..."
        : text;

}

function formatDate(date) {

    return new Date(date).toLocaleDateString("en-US", {

        month: "long",
        day: "numeric",
        year: "numeric"

    });

}

openBtn.onclick = () => {
    modal.classList.add("show");
    updateFields();
};

closeBtn.onclick = closeModal;
cancelBtn.onclick = closeModal;

window.onclick = (e) => {
    if (e.target === modal)
        closeModal();
};

function closeModal() {

    modal.classList.remove("show");

    form.reset();

    updateFields();

}

postType.addEventListener("change", updateFields);

function updateFields() {

    const type = postType.value;

    eventFields.style.display = "none";
    authorGroup.style.display = "none";
    contentGroup.style.display = "block";

    const status = document.getElementById("status");

    status.innerHTML = "";

    if (type === "announcement") {

        status.innerHTML = `
            <option>Published</option>
            <option>Draft</option>
            <option>Archived</option>
        `;

    }

    else if (type === "news") {

        authorGroup.style.display = "block";

        status.innerHTML = `
            <option>Published</option>
            <option>Draft</option>
            <option>Archived</option>
        `;

    }

    else {

        eventFields.style.display = "block";
        contentGroup.style.display = "none";

        status.innerHTML = `
            <option>Upcoming</option>
            <option>Ongoing</option>
            <option>Completed</option>
            <option>Cancelled</option>
        `;

    }

    selectedFiles.innerHTML = "";
    attachmentInput.value = "";

    if (type === "announcement") {

        attachmentLabel.textContent = "Attachments";

        attachmentHint.textContent =
            "You may upload PDFs, Word, Excel, ZIP, images, or any file.";

        attachmentInput.accept = "";

    }

    else if (type === "news") {

        attachmentLabel.textContent = "News Images";

        attachmentHint.textContent =
            "Upload one or more images.";

        attachmentInput.accept = "image/*";

    }

    else {

        attachmentLabel.textContent = "Event Images";

        attachmentHint.textContent =
            "Upload posters or event images.";

        attachmentInput.accept = "image/*";

    }

}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const type = postType.value;

    let result;

    if (type === "announcement") {

        result = await supa
            .from("announcements")
            .insert({

                title: document.getElementById("title").value,

                content: document.getElementById("content").value,

                status: document.getElementById("status").value

            });

    }

    else if (type === "news") {

        result = await supa
            .from("news")
            .insert({

                title: document.getElementById("title").value,

                content: document.getElementById("content").value,

                author: document.getElementById("author").value,

                status: document.getElementById("status").value

            });

    }

    else {

        result = await supa
            .from("events")
            .insert({

                title: document.getElementById("title").value,

                description: document.getElementById("eventDescription").value,

                event_date: document.getElementById("eventDate").value,

                event_time: document.getElementById("eventTime").value || null,

                location: document.getElementById("eventLocation").value,

                status: document.getElementById("status").value

            });

    }

    if (result.error) {

        alert(result.error.message);

        return;

    }

    alert("Post created successfully!");

    closeModal();

});

attachmentInput.addEventListener("change", () => {

    selectedFiles.innerHTML = "";

    [...attachmentInput.files].forEach(file => {

        const div = document.createElement("div");

        div.className = "selected-file";

        div.innerHTML = `
            <span>${file.name}</span>
            <span>${(file.size / 1024).toFixed(1)} KB</span>
        `;

        selectedFiles.appendChild(div);

    });

});

async function uploadNews() {
    const { data, error } = await supa
        .from("news")
        .insert({
            title: document.getElementById("title").value,
            content: document.getElementById("content").value,
            author: document.getElementById("author").value,
            status: document.getElementById("status").value
        })
        .select()
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    for (const file of attachmentInput.files) {

        const path = `${data.news_id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supa.storage
            .from("news")
            .upload(path, file);

        if (uploadError) {
            console.error(uploadError);
            continue;
        }

        const { data: urlData } = supa.storage
            .from("news")
            .getPublicUrl(path);

        await supa.from("post_attachments").insert({
            news_id: data.news_id,
            post_type: "news",
            file_type: "image",
            file_name: file.name,
            file_url: urlData.publicUrl
        });

    }
}

async function uploadAnnouce() {
    const { data, error } = await supa
        .from("announcements")
        .insert({
            title: document.getElementById("title").value,
            content: document.getElementById("content").value,
            status: document.getElementById("status").value
        })
        .select()
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    for (const file of attachmentInput.files) {

        const path = `${data.announcement_id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supa.storage
            .from("announcements")
            .upload(path, file);

        if (uploadError) {
            console.error(uploadError);
            continue;
        }

        const { data: urlData } = supa.storage
            .from("announcements")
            .getPublicUrl(path);

        await supa.from("post_attachments").insert({
            announcement_id: data.announcement_id,
            post_type: "announcement",
            file_type: "file",
            file_name: file.name,
            file_url: urlData.publicUrl
        });

    }
}

async function uploadEvent() {
    const { data, error } = await supa
        .from("events")
        .insert({
            title: document.getElementById("title").value,
            description: document.getElementById("eventDescription").value,
            event_date: document.getElementById("eventDate").value,
            event_time: document.getElementById("eventTime").value || null,
            location: document.getElementById("eventLocation").value,
            status: document.getElementById("status").value
        })
        .select()
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    for (const file of attachmentInput.files) {

        const path = `${data.event_id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supa.storage
            .from("events")
            .upload(path, file);

        if (uploadError) {
            console.error(uploadError);
            continue;
        }

        const { data: urlData } = supa.storage
            .from("events")
            .getPublicUrl(path);

        await supa.from("post_attachments").insert({
            event_id: data.event_id,
            post_type: "event",
            file_type: "image",
            file_name: file.name,
            file_url: urlData.publicUrl
        });

    }
}
async function openPost(type, id) {

    let table;
    let idColumn;

    switch (type) {
        case "announcement":
            table = "announcements";
            idColumn = "announcement_id";
            break;

        case "news":
            table = "news";
            idColumn = "news_id";
            break;

        case "event":
            table = "events";
            idColumn = "event_id";
            break;
    }

    const { data: post, error } = await supa
        .from(table)
        .select("*")
        .eq(idColumn, id)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    const { data: attachments, error: attachmentError } = await supa
        .from("post_attachments")
        .select("*")
        .eq(idColumn, id);

    if (attachmentError) {
        console.error(attachmentError);
    }

    console.log("Post:", post);
    console.log("Attachments:", attachments);

    displayPost(type, post, attachments || []);
}

function displayPost(type, post, attachments) {

    const readTitle = document.getElementById("readTitle");
    const readContent = document.getElementById("readContent");
    const imageGallery = document.getElementById("imageGallery");
    const attachmentList = document.getElementById("attachmentList");
    const eventInfo = document.getElementById("eventInfo");

    readTitle.textContent = post.title;
    readContent.textContent = "";

    imageGallery.innerHTML = "";
    attachmentList.innerHTML = "";
    eventInfo.innerHTML = "";

    // Hide sections initially
    imageGallery.style.display = "none";
    attachmentList.style.display = "none";
    eventInfo.style.display = "none";

    if (type === "announcement") {

        readContent.textContent = post.content;

        if (attachments.length > 0) {

            attachmentList.style.display = "block";

            attachments.forEach(file => {

                attachmentList.innerHTML += `
                    <a
                        class="attachment-item"
                        href="${file.file_url}"
                        target="_blank"
                    >
                        📎 ${file.file_name}
                    </a>
                `;

            });

        }

    }

    else if (type === "news") {

        readContent.textContent = post.content;

        const images = attachments.filter(file => file.file_type === "image");
        console.log("News Images:", images);


        if (images.length > 0) {

            imageGallery.style.display = "flex";

            console.log(images.length)
            images.forEach(image => {

                imageGallery.innerHTML += `
                    <img
                        src="${image.file_url}"
                        alt="${image.file_name}"
                    >
                `;

            });

        }

    }

    else {

        readContent.textContent = post.description;

        eventInfo.style.display = "block";

        eventInfo.innerHTML = `
            <p><strong>Date:</strong> ${post.event_date}</p>
            <p><strong>Time:</strong> ${post.event_time ?? "N/A"}</p>
            <p><strong>Location:</strong> ${post.location ?? "N/A"}</p>
        `;

        const images = attachments.filter(file => file.file_type === "image");

        if (images.length > 0) {

            imageGallery.style.display = "flex";

            images.forEach(image => {

                imageGallery.innerHTML += `
                    <img
                        src="${image.file_url}"
                        alt="${image.file_name}"
                    >
                `;

            });

        }

    }

    document.getElementById("readModal").classList.add("show");

}