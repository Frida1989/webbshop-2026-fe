const eventDetails = document.getElementById("eventDetails");
const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");

const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

let currentEvent = null;

function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getSpotsLeft(event) {
  return event.spotsLeft - (event.currentBookings || 0);
}

function updateBookingButtonState(event) {
  const submitButton = document.querySelector(".booking-submit-btn");
  if (!submitButton) return;

  const spotsLeft = getSpotsLeft(event);

  if (spotsLeft <= 0) {
    submitButton.disabled = true;
    submitButton.textContent = "Event is fully booked";
    bookingMessage.textContent =
      "This event is fully booked. Please choose another event.";
    bookingMessage.style.color = "red";
  } else {
    submitButton.disabled = false;
    submitButton.textContent = "Reserve your spot";
    bookingMessage.textContent = "";
  }
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

  updateBookingButtonState(event);
}

function autofillBookingForm() {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return;

  const user = JSON.parse(storedUser);

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");

  if (user.name && nameInput) {
    nameInput.value = user.name;
  }

  if (user.email && emailInput) {
    emailInput.value = user.email;
  }
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
    currentEvent = event;

    console.log("Event details:", event);

    renderEventDetails(event);
  } catch (error) {
    console.error("Error loading event details:", error);
    eventDetails.innerHTML = "<p>Could not load event details.</p>";
  }
}

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentEvent) {
    bookingMessage.textContent = "Could not load event information.";
    bookingMessage.style.color = "red";
    return;
  }

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const quantity = Number(document.getElementById("quantity").value);

  if (!name || !email || !quantity || quantity < 1) {
    bookingMessage.textContent = "Please fill in all fields correctly.";
    bookingMessage.style.color = "red";
    return;
  }

  const spotsLeft = getSpotsLeft(currentEvent);

  if (spotsLeft <= 0) {
    bookingMessage.textContent = "Sorry, this event is fully booked.";
    bookingMessage.style.color = "red";
    updateBookingButtonState(currentEvent);
    return;
  }

  if (quantity > spotsLeft) {
    bookingMessage.textContent = `Only ${spotsLeft} spot(s) left for this event.`;
    bookingMessage.style.color = "red";
    return;
  }

  const bookingData = {
    eventId,
    quantity,
    name,
    email,
  };

  const submitButton = document.querySelector(".booking-submit-btn");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Processing...";
  }

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

    const confirmationData = {
      eventTitle: currentEvent.title,
      eventDate: currentEvent.date,
      eventLocation: currentEvent.location,
      quantity,
      name,
      email,
    };

    localStorage.setItem("latestBooking", JSON.stringify(confirmationData));

    window.location.href = "booking-confirmation.html";
  } catch (error) {
    console.error("Booking error:", error);
    bookingMessage.textContent =
      "Could not complete booking. Please try again.";
    bookingMessage.style.color = "red";

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Reserve your spot";
    }
  }
});

loadEventDetails();
autofillBookingForm();
