import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm';

const form = document.getElementById('createProductForm');
const tbody = document.getElementById('productsTableBody');
const token = localStorage.getItem('token');
let allEvents = [];
let allBookings = [];

let openDropdownId = null;


if (!token) {
  window.location.href = 'login.html'; // go back to login if no token
}


const api = axios.create({
  baseURL: 'https://webbshop-2026-be-one.vercel.app/events',   // bring events
  headers: { Authorization: `Bearer ${token}` },
});

const bookingsApi = axios.create({
  baseURL: 'https://webbshop-2026-be-one.vercel.app/bookings',    // same sutuff but for bookings
  headers: { Authorization: `Bearer ${token}` },
});

function formatDate(dateString) {
  if (!dateString) return '-';       // Formats ISO date into readable Swedish format
  return new Date(dateString).toLocaleDateString('sv-SE', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getSpotsLeft(event) {
  const bookingsForEvent = allBookings.filter(
    (b) => b.event?._id === event._id || b.event === event._id        // Calculates remaining spots for an event
  );

  const bookedSpots = bookingsForEvent.reduce(
    (total, b) => total + (b.quantity || 0),
    0
  );

  return event.maxCapacity - bookedSpots;
}

function getBookingsForEvent(eventId) {        // Returns all bookings for a specific event
  return allBookings.filter(
    (b) => b.event?._id === eventId || b.event === eventId
  );
}

// CREATE EVENT
form.addEventListener('submit', async (e) => {
  e.preventDefault(); // prevent page reload

  const description = document.getElementById('description').value.trim();
  const price = Number(document.getElementById('price').value);
  const maxCapacity = Number.parseInt(document.getElementById('spots').value, 10);
  const imageUrl = document.getElementById('image').value.trim();
  const location = document.getElementById('location').value;
  const category = document.getElementById('category').value;
  const dateValue = document.getElementById('date').value;
  const title = document.getElementById('name').value.trim();

  if (!title || !description || !imageUrl || !location || !category || !dateValue) {    // Validate required fields
    alert('Fill all fields');
    return;
  }

  // Convert date to iso format
  const isoDate = new Date(dateValue).toISOString();

  try {
    // Send POST request to create event
    await api.post('/', {
      title,
      description,
      date: isoDate,
      location,
      maxCapacity,
      price,
      imageUrl,
      category,
    });

    form.reset(); // Reset form after success

    // Reload events list
    loadEvents();
  } catch {
    alert('Create failed');
  }
});

// DELETE EVENT
async function deleteEvent(id) {
  if (!confirm('Delete event?')) return;

  await api.delete(`/${id}`);
  loadEvents();
}

// BOOKINGS

// Delete booking by ID
async function deleteBooking(id) {
  if (!confirm('Delete booking?')) return;

  await bookingsApi.delete(`/${id}`);

  await loadBookings();    // Reload bookings and refresh event capacity display
  renderEvents(allEvents);
}

// EDIT EVENT
function enableEventEditMode(row) {
  const id = row.dataset.id;

  const event = allEvents.find((e) => e._id === id);

  if (!event) {
    alert('Event not found');
    return;
  }

  const originalHTML = row.innerHTML;

  row.innerHTML = `
    <td><input type="text" value="${event.title}" class="edit-title"></td>
    <td><input type="date" value="${event.date?.split('T')[0]}" class="edit-date"></td>
    <td><input type="text" value="${event.location}" class="edit-location"></td>
    <td><input type="number" value="${event.price}" class="edit-price"></td>
    <td><input type="number" value="${event.maxCapacity}" class="edit-capacity"></td>
    <td>
      <button class="save-event">Save</button>
      <button class="cancel-event">Cancel</button>
    </td>
  `;

  const saveBtn = row.querySelector('.save-event');
  const cancelBtn = row.querySelector('.cancel-event');

  cancelBtn.onclick = () => {
    row.innerHTML = originalHTML;
    attachListeners();
  };

  saveBtn.onclick = async () => {
    try {
      const updatedEvent = {
        ...event,
        title: row.querySelector('.edit-title').value.trim(),
        date: new Date(row.querySelector('.edit-date').value).toISOString(),
        location: row.querySelector('.edit-location').value,
        price: Number(row.querySelector('.edit-price').value),
        maxCapacity: Number(row.querySelector('.edit-capacity').value),
      };

      await api.put(`/${id}`, updatedEvent);

      await loadEvents();
    } catch (err) {
      console.error(err);
      alert('Failed to update event');
    }
  };
}

// EDIT BOOKING
function enableBookingEditMode(row) {     // Enable editing for booking
  const id = row.dataset.id;

  const booking = allBookings.find((b) => b._id === id);

  if (!booking) {
    alert('Booking not found');
    return;
  }

  const originalHTML = row.innerHTML;
// Replace row with editable fields
  row.innerHTML = `
    <td>${booking.name}</td>
    <td>${booking.email}</td>        
    <td>
      <input 
        type="number" 
        value="${booking.quantity}" 
        class="edit-quantity"
        min="1"
      >
    </td>
    <td>
      <button class="save-booking">Save</button>
      <button class="cancel-booking">Cancel</button>
    </td>
  `;

  const saveBtn = row.querySelector('.save-booking');
  const cancelBtn = row.querySelector('.cancel-booking');

  // CANCEL EDIT
  cancelBtn.onclick = () => {
    row.innerHTML = originalHTML;
    attachListeners(); // reattach events after DOM change
  };

  // SAVE EDIT
  saveBtn.onclick = async () => {
    try {
      const quantity = Number(row.querySelector('.edit-quantity').value);

      // Validate input
      if (!quantity || quantity < 1) {
        alert('Quantity must be at least 1');
        return;
      }

      // Send update request
      await bookingsApi.put(`/${id}`, {
        quantity,
      });

      // Reload data and refresh the page
      await loadBookings();
      renderEvents(allEvents);
    } catch (err) {
      console.error(err);
      alert('Failed to update booking');
    }
  };
}

function printDropdown(eventId) {
  const event = allEvents.find(e => e._id === eventId);
  const bookings = getBookingsForEvent(eventId);

  if (!event) return;

  const printSection = document.createElement('div');

  printSection.innerHTML = `
    <div class="print-only">
      <h2>${event.title} - Bookings</h2>

      ${
        bookings.length
          ? `
        <table border="1" style="width:100%; border-collapse:collapse;">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Spots</th>
          </tr>

          ${bookings.map(b => `
            <tr>
              <td>${b.name}</td>
              <td>${b.email}</td>
              <td>${b.quantity}</td>
            </tr>
          `).join('')}
        </table>
      `
          : '<p>No bookings</p>'
      }
    </div>
  `;

  document.body.appendChild(printSection);

  window.print();

  // cleanup after printing
  setTimeout(() => {
    printSection.remove();
  }, 1000);
}

// RENDER EVENTS
function renderEvents(events) {
  tbody.innerHTML = events
    .map((event) => {
      const spotsLeft = getSpotsLeft(event);
      const bookings = getBookingsForEvent(event._id);

      // Check if dropdown is open for this event
      const isOpen = openDropdownId === event._id;

      return `
      <tr data-id="${event._id}">
        <td class="event-title" style="cursor:pointer">${event.title}</td>
        <td>${formatDate(event.date)}</td>
        <td>${event.location}</td>
        <td>${event.price} kr</td>
        <td>${spotsLeft <= 0 ? 'Sold out' : spotsLeft}</td>
        <td>
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
          <button class="print-dropdown-btn">Print</button>
        </td>
      </tr>

      ${
        // Dropdown section
        isOpen
          ? `
        <tr class="dropdown-row">
          <td colspan="6">
            ${
              bookings.length
                ? `
              <table class="inner-table">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Spots</th>
                  <th>Actions</th>
                </tr>

                ${bookings
                  .map(
                    (b) => `
                  <tr data-id="${b._id}">
                    <td>${b.name}</td>
                    <td>${b.email}</td>
                    <td>${b.quantity}</td>
                    <td>
                      <button class="edit-booking-btn">Edit</button>
                      <button class="delete-booking-btn">Delete</button>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </table>
            `
                : 'No bookings'
            }
          </td>
        </tr>
      `
          : ''
      }
      `;
    })
    .join('');

  attachListeners(); // rebind events after DOM update
}

// LISTENERS

// Attach event listeners for event buttons
function attachListeners() {
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.onclick = (e) =>
      deleteEvent(e.target.closest('tr').dataset.id);
  });

  // Toggle dropdown
  document.querySelectorAll('.toggle-btn, .event-title').forEach((btn) => {
    btn.onclick = (e) => {
      const id = e.target.closest('tr').dataset.id;

      openDropdownId = openDropdownId === id ? null : id;

      renderEvents(allEvents);
    };
  });

  // Edit event buttons
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.onclick = (e) =>
    enableEventEditMode(e.target.closest('tr'));
  });

  // Delete booking buttons
  document.querySelectorAll('.delete-booking-btn').forEach((btn) => {
    btn.onclick = (e) =>
      deleteBooking(e.target.closest('tr').dataset.id);
  });

  // Edit booking buttons
  document.querySelectorAll('.edit-booking-btn').forEach((btn) => {
    btn.onclick = (e) =>
      enableBookingEditMode(e.target.closest('tr'));
  });

  // PRINT DROPDOWN BUTTON (NEW)
  document.querySelectorAll('.print-dropdown-btn').forEach((btn) => {
    btn.onclick = (e) => {
      const id = e.target.closest('tr').dataset.id;
      printDropdown(id);
    };
  });
}

// LOAD DATA
// Load all events from API
async function loadEvents() {
  const res = await api.get('/');
  allEvents = res.data;
  renderEvents(allEvents);
}

// Load all bookings from API
async function loadBookings() {
  const res = await bookingsApi.get('/');
  allBookings = res.data;
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadBookings();
  await loadEvents();
});