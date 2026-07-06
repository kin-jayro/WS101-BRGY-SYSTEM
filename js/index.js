import { supa, requireAuth } from "./supabase.js";

async function init() {
    await requireAuth()
}
init()

async function loadAnnouncements() {

    const { data, error } = await supa
        .from("announcements")
        .select("*")
        .order("publish_date", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const list = document.getElementById("announcementList");
    list.innerHTML = "";

    data.forEach(item => {

        list.innerHTML += `
            <div class="feed-item">
                <span class="feed-date">
                    ${new Date(item.publish_date).toLocaleDateString()}
                </span>

                <h4>${item.title}</h4>

                <p>${item.content}</p>
            </div>
        `;
    });

}

async function loadNews() {

    const { data, error } = await supa
        .from("news")
        .select("*")
        .order("publish_date", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const list = document.getElementById("newsList");
    list.innerHTML = "";

    data.forEach(item => {

        list.innerHTML += `
            <div class="feed-item">

                <span class="feed-date">
                    ${new Date(item.publish_date).toLocaleDateString()}
                </span>

                <h4>${item.title}</h4>

                <p>${item.content}</p>

            </div>
        `;
    });

}

async function loadEvents() {

    const { data, error } = await supa
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    const list = document.getElementById("eventList");
    list.innerHTML = "";

    data.forEach(item => {

        list.innerHTML += `
            <div class="feed-item event-item">

                <span class="feed-date">
                    ${new Date(item.event_date).toLocaleDateString()}
                </span>

                <h4>${item.title}</h4>

                <p>
                    <strong>Time:</strong> ${item.event_time ?? "TBA"}<br>
                    <strong>Location:</strong> ${item.location}
                </p>

            </div>
        `;
    });

}

loadAnnouncements();
loadNews();
loadEvents();

// Realtime - Announcements
supa
  .channel("announcements-changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "announcements",
    },
    () => {
      loadAnnouncements();
    }
  )
  .subscribe();

// Realtime - News
supa
  .channel("news-changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "news",
    },
    () => {
      loadNews();
    }
  )
  .subscribe();

// Realtime - Events
supa
  .channel("events-changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "events",
    },
    () => {
      loadEvents();
    }
  )
  .subscribe();
