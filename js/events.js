document.addEventListener("DOMContentLoaded", () => {
  const eventsGrid = document.getElementById("eventsGrid");
  const searchForm = document.querySelector(".hero-search-card");
  const locationSelect = document.getElementById("location");
  const dateInput = document.getElementById("datepicker");
  const categorySelect = document.getElementById("category");

  let allEvents = [];

  function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getSpotsLeft(event) {
    if (event.spotsLeft !== undefined && event.spotsLeft !== null) {
      return Number(event.spotsLeft);
    }

    const maxCapacity = Number(event.maxCapacity) || 0;
    const currentBookings = Number(event.currentBookings) || 0;

    return Math.max(0, maxCapacity - currentBookings);
  }

  function getUpcomingEvents(eventsList) {
    const now = new Date();
    return eventsList.filter((event) => new Date(event.date) > now);
  }

  function sortEventsByDate(eventsList) {
    return [...eventsList].sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function filterEvents(eventsList, filters) {
    return eventsList.filter((event) => {
      const matchesLocation =
        !filters.location || event.location === filters.location;

      const matchesCategory =
        !filters.category ||
        event.category?.toLowerCase() === filters.category.toLowerCase();

      const matchesDate =
        !filters.date ||
        new Date(event.date).toISOString().split("T")[0] === filters.date;

      return matchesLocation && matchesCategory && matchesDate;
    });
  }

  function renderEvents(eventsList) {
    eventsGrid.innerHTML = "";

    if (eventsList.length === 0) {
      eventsGrid.innerHTML = "<p>No events match your search.</p>";
      return;
    }

    eventsList.forEach((event) => {
      const spotsLeft = getSpotsLeft(event);

      const eventCard = document.createElement("article");
      eventCard.classList.add("event-card");

      eventCard.innerHTML = `
        <div class="event-image">
          <img src="${event.imageUrl}" alt="${event.title}">
          <span class="event-category">${event.category}</span>
          <span class="event-spots">
            ${spotsLeft === 0 ? "Sold out" : `${spotsLeft} spots left`}
          </span>
        </div>

        <div class="event-content">
          <div class="event-date">${formatDate(event.date)}</div>
          <h3>${event.title}</h3>
          <p class="event-description">${event.description}</p>

          <div class="event-meta">
            <span>📍 ${event.location}</span>
            <span>🎟 ${event.price} kr</span>
          </div>

          <a href="event-details.html?id=${event._id}" class="event-button">Book now</a>
        </div>
      `;

      eventsGrid.appendChild(eventCard);
    });
  }

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const filters = {
      location: locationSelect.value,
      date: dateInput.value,
      category: categorySelect.value,
    };

    const upcomingEvents = getUpcomingEvents(allEvents);
    const filteredEvents = filterEvents(upcomingEvents, filters);
    const sortedEvents = sortEventsByDate(filteredEvents);

    renderEvents(sortedEvents);
  });

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
      allEvents = events;

      console.log("API data:", events);

      const upcomingEvents = getUpcomingEvents(allEvents);
      const sortedEvents = sortEventsByDate(upcomingEvents);

      renderEvents(sortedEvents);
    } catch (error) {
      console.error("Error:", error);
      eventsGrid.innerHTML = "<p>Could not load events.</p>";
    }
  }

  loadEvents();
});
