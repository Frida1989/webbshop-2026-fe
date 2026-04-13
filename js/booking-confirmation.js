const confirmationDetails = document.getElementById("confirmationDetails");

function formatDate(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getTicketText(quantity) {
  const safeQuantity = Number(quantity) || 1;
  return safeQuantity === 1 ? "1 ticket" : `${safeQuantity} tickets`;
}

function createEmptyState(message, extraText = "") {
  return `
    <div class="confirmation-empty-state" role="status" aria-live="polite">
      <p>${message}</p>
      ${extraText ? `<p>${extraText}</p>` : ""}
    </div>
  `;
}

function renderConfirmation() {
  if (!confirmationDetails) return;

  const storedBooking = localStorage.getItem("latestBooking");

  if (!storedBooking) {
    confirmationDetails.innerHTML = createEmptyState(
      "We could not find your booking details.",
      "Please return to the event page and try again.",
    );
    return;
  }

  let booking;

  try {
    booking = JSON.parse(storedBooking);
  } catch (error) {
    console.error("Invalid booking data in localStorage:", error);

    confirmationDetails.innerHTML = createEmptyState(
      "We could not read your booking details.",
      "Please return to the event page and try again.",
    );
    return;
  }

  const eventTitle = booking.eventTitle || "Not available";
  const eventDate = formatDate(booking.eventDate);
  const eventLocation = booking.eventLocation || "Not available";
  const quantity = booking.quantity || 1;
  const name = booking.name || "Guest";
  const email = booking.email || "Not available";

  confirmationDetails.setAttribute("role", "status");
  confirmationDetails.setAttribute("aria-live", "polite");
  confirmationDetails.setAttribute("tabindex", "-1");

  confirmationDetails.innerHTML = `
    <div class="confirmation-grid">
      <div class="confirmation-item">
        <span class="confirmation-label">Event</span>
        <p>${eventTitle}</p>
      </div>

      <div class="confirmation-item">
        <span class="confirmation-label">Date</span>
        <p>${eventDate}</p>
      </div>

      <div class="confirmation-item">
        <span class="confirmation-label">Address</span>
        <p>${eventLocation}</p>
      </div>

      <div class="confirmation-item">
        <span class="confirmation-label">Tickets</span>
        <p>${getTicketText(quantity)}</p>
      </div>

      <div class="confirmation-item">
        <span class="confirmation-label">Reserved for</span>
        <p>${name}</p>
      </div>

      <div class="confirmation-item">
        <span class="confirmation-label">Email</span>
        <p>${email}</p>
      </div>
    </div>

    <div class="confirmation-note">
      <h2>Thank you for your reservation</h2>
      <p>
        Your booking has been successfully confirmed, and we’re happy to have
        you with us.
      </p>
      <p>
        Please arrive a little early so you have enough time to find the venue,
        check in smoothly, and enjoy the full experience.
      </p>
      <p>
        Address: <strong>${eventLocation}</strong>
      </p>
    </div>
  `;

  confirmationDetails.focus();
}

document.addEventListener("DOMContentLoaded", renderConfirmation);
