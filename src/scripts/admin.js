const title = document.getElementById("name").value.trim();
const description = document.getElementById("description").value.trim();
const price = Number(document.getElementById("price").value);
const maxCapacity = Number.parseInt(document.getElementById("spots").value, 10);
const imageUrl = document.getElementById("image").value.trim();
const location = document.getElementById("location").value;
const dateValue = document.getElementById("date").value;
const category = document.getElementById("category").value;
const bookingsTbody = document.getElementById("bookingsTableBody");

let allBookings = [];

import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm";

const API_URL = "https://webbshop-2026-be-one.vercel.app/events";

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const bookingsApi = axios.create({
  baseURL: "https://webbshop-2026-be-one.vercel.app/bookings",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
    return Promise.reject(err);
  }
);

const form = document.getElementById("createProductForm");
const tbody = document.getElementById("productsTableBody");

let allEvents = [];

// ---------- HELPERS ----------
function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getSpotsLeft(event) {
  return event.maxCapacity - (event.currentBookings || 0);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const price = Number(document.getElementById("price").value);
  const maxCapacity = Number.parseInt(document.getElementById("spots").value, 10);
  const imageUrl = document.getElementById("image").value.trim();

  const locationEl = document.getElementById("location");
  const categoryEl = document.getElementById("category");
  const dateEl = document.getElementById("date");

  const location = locationEl.value;
  const category = categoryEl.value;
  const dateValue = dateEl.value;

  if (
    !title ||
    !description ||
    !imageUrl ||
    !location ||
    !category ||
    !dateValue
  ) {
    alert("Please fill in all fields");
    return;
  }

  if (Number.isNaN(price) || Number.isNaN(maxCapacity)) {
    alert("Price or capacity is invalid");
    return;
  }

  const dateObj = new Date(dateValue);

  if (isNaN(dateObj.getTime())) {
    alert("Invalid date");
    return;
  }

  const isoDate = dateObj.toISOString();

  try {
    await api.post("", {
      title,
      description,
      date: isoDate,
      location,
      maxCapacity,
      price,
      imageUrl,
      category,
    });

    form.reset();
    loadEvents();
  } catch (err) {
    console.log("STATUS:", err.response?.status);
    console.log("DATA:", err.response?.data);

    alert(err.response?.data?.message || "Failed to create event");
  }
});

// ---------- DELETE ----------
async function deleteEvent(id) {
  if (!confirm("Delete this event?")) return;

  try {
    await api.delete(`/${id}`);
    loadEvents();
  } catch (err) {
    console.error(err.response?.data || err);
    alert("Delete failed");
  }
}

// ---------- EDIT ----------
function enableEditMode(row) {
  const id = row.dataset.id;
  const event = allEvents.find((e) => e._id === id);

  row.innerHTML = `
    <td><input value="${event.title || ""}" class="edit-title"></td>
    <td><input type="date" value="${event.date ? event.date.split("T")[0] : ""}" class="edit-date"></td>
    <td><input value="${event.location || ""}" class="edit-location"></td>
    <td><input type="number" value="${event.price || 0}" class="edit-price"></td>
    <td><input type="number" value="${event.maxCapacity || 0}" class="edit-capacity"></td>
    <td class="actions">
      <button class="save-btn">Save</button>
      <button class="cancel-btn">Cancel</button>
    </td>
  `;

  row.querySelector(".save-btn").onclick = async () => {
    const updated = {
      ...event,
      title: row.querySelector(".edit-title").value,
      date: row.querySelector(".edit-date").value,
      location: row.querySelector(".edit-location").value,
      price: parseFloat(row.querySelector(".edit-price").value),
      maxCapacity: parseInt(row.querySelector(".edit-capacity").value, 10),
    };

    try {
      await api.put(`/${id}`, updated);
      loadEvents();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Update failed");
    }
  };

  row.querySelector(".cancel-btn").onclick = () => {
    renderEvents(allEvents);
  };
}

// ---------- RENDER ----------
function renderEvents(events) {
  if (!events.length) {
    tbody.innerHTML = `<tr><td colspan="7">No events</td></tr>`;
    return;
  }

  tbody.innerHTML = events
    .map((event) => {
      const spotsLeft = getSpotsLeft(event);

      return `
        <tr data-id="${event._id}">
          <td>${event.title || "-"}</td>
          <td>${formatDate(event.date)}</td>
          <td>${event.location || "-"}</td>
          <td>${event.price ?? 0} kr</td>
          <td>${spotsLeft}</td>
          <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  attachListeners();
}

function renderBookings(bookings) {
  if (!bookings.length) {
    bookingsTbody.innerHTML = `<tr><td colspan="5">No bookings</td></tr>`;
    return;
  }

  bookingsTbody.innerHTML = bookings
    .map((booking) => {
      return `
        <tr data-id="${booking._id}">
          <td>${booking.user?.name || "Unknown"}</td>
          <td>${booking.event?.title || "Unknown event"}</td>
          <td>${formatDate(booking.event?.date)}</td>
          <td>${booking.spots || 1}</td>
          <td>
            <button class="edit-booking-btn">Edit</button>
            <button class="delete-booking-btn">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  attachBookingListeners();
}

// ---------- LISTENERS ----------
function attachListeners() {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.onclick = (e) => {
      const id = e.target.closest("tr").dataset.id;
      deleteEvent(id);
    };
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.onclick = (e) => {
      enableEditMode(e.target.closest("tr"));
    };
  });
}

function attachBookingListeners() {
  document.querySelectorAll(".delete-booking-btn").forEach((btn) => {
    btn.onclick = (e) => {
      const id = e.target.closest("tr").dataset.id;
      deleteBooking(id);
    };
  });

  document.querySelectorAll(".edit-booking-btn").forEach((btn) => {
    btn.onclick = (e) => {
      enableBookingEditMode(e.target.closest("tr"));
    };
  });
}

// ---------- LOAD ----------
async function loadEvents() {
  tbody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

  try {
    const res = await api.get("/");
    allEvents = res.data;
    renderEvents(allEvents);
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7">Failed to load</td></tr>`;
  }
}

async function loadBookings() {
  bookingsTbody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;

  try {
    const res = await bookingsApi.get("/");
    allBookings = res.data;
    renderBookings(allBookings);
  } catch (err) {
    console.error(err);
    bookingsTbody.innerHTML = `<tr><td colspan="5">Failed to load</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", loadEvents);