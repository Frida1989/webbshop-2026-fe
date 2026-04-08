const eventDetails = document.getElementById("eventDetails");
const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");

const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getSpotsLeft(event) {
  return event.maxCapacity - (event.currentBookings || 0);
}

function renderEventDetails(event) {
  const spotsLeft = getSpotsLeft(event);

  eventDetails.innerHTML = `
    <div class="event-details-image">
      <img src="${event.imageUrl}" alt="${event.title}">
    </div>

    <div class="event-details-content">
      <span class="event-category-badge">${event.category}</span>
      <h1>${event.title}</h1>
      <p class="event-details-description">${event.description}</p>

      <div class="event-details-meta">
        <p><strong>Date:</strong> ${formatDate(event.date)}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Price:</strong> ${event.price} kr</p>
        <p><strong>Spots left:</strong> ${spotsLeft}</p>
      </div>
    </div>
  `;
}

async function loadEventDetails() {
  if (!eventId) {
    eventDetails.innerHTML = "<p>No event selected.</p>";
    return;
  }

  try {
    const response = await fetch(
      `https://webbshop-2026-be-one.vercel.app/events/${eventId}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch event details");
    }

    const event = await response.json();
    console.log("Event details:", event);

    renderEventDetails(event);
  } catch (error) {
    console.error("Error loading event details:", error);
    eventDetails.innerHTML = "<p>Could not load event details.</p>";
  }
}

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const quantity = Number(document.getElementById("quantity").value);

  const bookingData = {
    eventId,
    quantity,
    name,
    email,
  };

  try {
    const response = await fetch(
      "https://webbshop-2026-be-one.vercel.app/bookings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      },
    );

    if (!response.ok) {
      throw new Error("Booking failed");
    }

    bookingMessage.textContent = "Your booking was successful!";
    bookingMessage.style.color = "green";

    bookingForm.reset();
    loadEventDetails();
  } catch (error) {
    console.error("Booking error:", error);
    bookingMessage.textContent =
      "Could not complete booking. Please try again.";
    bookingMessage.style.color = "red";
  }
});

loadEventDetails();
