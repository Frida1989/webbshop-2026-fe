document.addEventListener("DOMContentLoaded", () => {
  const eventsGrid = document.getElementById("eventsGrid");

  function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getSpotsLeft(event) {
    return event.spotsLeft - (event.currentBookings || 0);
  }

  function getUpcomingEvents(eventsList) {
    const now = new Date();
    return eventsList.filter((event) => new Date(event.date) > now);
  }

  function sortEventsByDate(eventsList) {
    return [...eventsList].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function renderEvents(eventsList) {
    eventsGrid.innerHTML = "";

    eventsList.forEach((event) => {
      const spotsLeft = getSpotsLeft(event);
      const isSoldOut = spotsLeft === 0;

      const spotsText = isSoldOut ? "Sold out" : `${spotsLeft} spots left`;

      const buttonText = isSoldOut ? "Sold out-More info" : "Book now";

      const buttonClass = isSoldOut
        ? "event-button event-button--soldout"
        : "event-button";

      const eventCard = document.createElement("article");
      eventCard.classList.add("event-card");

      eventCard.innerHTML = `
        <div class="event-image">
          <img src="${event.imageUrl}" alt="${event.title}">
          <span class="event-category">${event.category}</span>
          <span class="event-spots">${spotsLeft} spots left</span>
        </div>

        <div class="event-content">
          <div class="event-date">${formatDate(event.date)}</div>
          <h3>${event.title}</h3>
          <p class="event-description">${event.description}</p>

          <div class="event-meta">
            <span>📍 ${event.location}</span>
            <span>🎟 ${event.price} kr</span>
          </div>

          <a href="event-details.html?id=${event._id}" class="${buttonClass}">
  ${buttonText}
</a>
        </div>
      `;

      eventsGrid.appendChild(eventCard);
    });
  }

  async function loadEvents() {
    try {
      eventsGrid.innerHTML = "<p>Loading events...</p>";

      const response = await fetch(
        "https://webbshop-2026-be-one.vercel.app/events",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const events = await response.json();

      console.log("API data:", events); // 🔥 viktigt för debug

      const upcomingEvents = getUpcomingEvents(events);
      const sortedEvents = sortEventsByDate(upcomingEvents);

      renderEvents(sortedEvents);
    } catch (error) {
      console.error("Error:", error);
      eventsGrid.innerHTML = "<p>Could not load events.</p>";
    }
  }

  loadEvents();
});
