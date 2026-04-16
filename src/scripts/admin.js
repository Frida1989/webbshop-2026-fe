import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm";

const API_URL = "https://webbshop-2026-be-one.vercel.app/events";

const form = document.getElementById("createProductForm");
const tbody = document.getElementById("productsTableBody");

const filterAllBtn = document.getElementById("filterAll");
const filterUpcomingBtn = document.getElementById("filterUpcoming");
const filterSoldOutBtn = document.getElementById("filterSoldOut");

let allEvents = [];

// ---------- HELPERS ----------
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getSpotsLeft(event) {
  return event.maxCapacity - (event.currentBookings || 0);
}

function isUpcoming(event) {
  return new Date(event.date) > new Date();
}

function isSoldOut(event) {
  return getSpotsLeft(event) <= 0;
}

// ---------- CREATE EVENT ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("name").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const maxCapacity = parseInt(document.getElementById("spots").value, 10);
  const imageUrl = document.getElementById("image").value.trim();
  const slug = document.getElementById("slug").value.trim();

  try {
    await axios.post(API_URL, {
      title,
      price,
      maxCapacity,
      imageUrl,
      slug,
      description: "Created from admin",
      location: "TBD",
      date: new Date().toISOString(),
      category: "General",
    });

    form.reset();
    loadEvents();
  } catch (err) {
    console.error(err);
    alert("Failed to create event");
  }
});

// ---------- DELETE ----------
async function deleteEvent(id) {
  if (!confirm("Are you sure you want to delete this event?")) return;

  try {
    await axios.delete(`${API_URL}/${id}`);
    loadEvents();
  } catch (err) {
    console.error(err);
    alert("Failed to delete event");
  }
}

// ---------- ENABLE EDIT MODE ----------
function enableEditMode(row) {
  const id = row.dataset.id;
  const event = allEvents.find((e) => e._id === id);

  row.classList.add("editing");

  row.innerHTML = `
    <td><input type="text" value="${event.title}" class="edit-title"></td>
    <td><input type="date" value="${event.date.split("T")[0]}" class="edit-date"></td>
    <td><input type="text" value="${event.location}" class="edit-location"></td>
    <td><input type="number" value="${event.price}" class="edit-price"></td>
    <td>${event.currentBookings || 0}</td>
    <td><input type="number" value="${event.maxCapacity}" class="edit-capacity"></td>
    <td>
      <button class="save-btn">Save</button>
      <button class="cancel-btn">Cancel</button>
    </td>
  `;

  // SAVE
  row.querySelector(".save-btn").addEventListener("click", async () => {
    const updatedEvent = {
      ...event,
      title: row.querySelector(".edit-title").value,
      date: row.querySelector(".edit-date").value,
      location: row.querySelector(".edit-location").value,
      price: parseFloat(row.querySelector(".edit-price").value),
      maxCapacity: parseInt(row.querySelector(".edit-capacity").value, 10),
    };

    try {
      await axios.put(`${API_URL}/${id}`, updatedEvent);
      loadEvents();
    } catch (err) {
      console.error(err);
      alert("Failed to update event");
    }
  });

  // CANCEL
  row.querySelector(".cancel-btn").addEventListener("click", () => {
    renderEvents(allEvents);
  });
}

// ---------- RENDER ----------
function renderEvents(events) {
  if (events.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No events found.</td></tr>`;
    return;
  }

  tbody.innerHTML = events
    .map((event) => {
      const spotsLeft = getSpotsLeft(event);
      const bookings = event.currentBookings || 0;

      return `
        <tr data-id="${event._id}">
          <td>${event.title}</td>
          <td>${formatDate(event.date)}</td>
          <td>${event.location}</td>
          <td>${event.price} kr</td>
          <td>${bookings}</td>
          <td>${spotsLeft}</td>
          <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  attachEventListeners();
}

// ---------- EVENTS ----------
function attachEventListeners() {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.closest("tr").dataset.id;
      deleteEvent(id);
    });
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      enableEditMode(row);
    });
  });
}

// ---------- LOAD ----------
async function loadEvents() {
  tbody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

  try {
    const res = await axios.get(API_URL);
    allEvents = res.data;

    renderEvents(allEvents);
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7">Failed to load events.</td></tr>`;
  }
}

// ---------- FILTERS ----------
filterAllBtn.addEventListener("click", () => {
  renderEvents(allEvents);
});

filterUpcomingBtn.addEventListener("click", () => {
  renderEvents(allEvents.filter(isUpcoming));
});

filterSoldOutBtn.addEventListener("click", () => {
  renderEvents(allEvents.filter(isSoldOut));
});

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", loadEvents);