import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm';

const form = document.getElementById('createProductForm');
const tbody = document.getElementById('productsTableBody');
const bookingsTbody = document.getElementById('bookingsTableBody');

const token = localStorage.getItem('token'); // Get auth token from localStorage

const description = document.getElementById('description').value.trim();
const price = Number(document.getElementById('price').value);
const maxCapacity = Number.parseInt(document.getElementById('spots').value, 10);
const imageUrl = document.getElementById('image').value.trim();
const location = document.getElementById('location').value;
const category = document.getElementById('category').value;
const dateValue = document.getElementById('date').value;
const title = document.getElementById('name').value.trim();

let allEvents = [];
let allBookings = [];

const eventsURL = 'https://webbshop-2026-be-one.vercel.app/events'; // api shortcut for events
const bookingsURL = 'https://webbshop-2026-be-one.vercel.app/bookings'; // same thing but for bookings

// Redirect to login if no token exists
if (!token) {
  window.location.href = 'login.html';
}

// AXIOS
const api = axios.create({
  baseURL: eventsURL,                   // Axios instance for events API (includes auth header)
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const bookingsApi = axios.create({
  baseURL: bookingsURL,                     // Axios instance for bookings API
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {                                        // Interceptor to handle unauthorized errors globally
    if (err.response?.status === 401) {
      localStorage.removeItem('token');     // remove invalid token
      window.location.href = 'login.html';   // redirect to login
    }
    return Promise.reject(err);
  }
);

function formatDate(dateString) {
  if (!dateString) return '-';                     // Format date to readable format
  return new Date(dateString).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getSpotsLeft(event) {
  const bookingsForEvent = allBookings.filter(                     // Calculate available spots for an event
    (b) => b.event?._id === event._id || b.event === event._id
  );

  const bookedSpots = bookingsForEvent.reduce(
    (total, b) => total + (b.quantity || 0),
    0
  );

  return event.maxCapacity - bookedSpots;
}

// CREATE EVENT
form.addEventListener('submit', async (e) => {    // Handle form submission
  e.preventDefault();      // prevent page reload

  if (!title || !description || !imageUrl || !location || !category || !dateValue) {  // Validate required fields
    alert('Please fill in all fields');
    return;
  }

  if (Number.isNaN(price) || Number.isNaN(maxCapacity)) {  // Validate numeric inputs
    alert('Price or capacity is invalid');
    return;
  }

  const isoDate = new Date(dateValue).toISOString(); // Convert date to ISO format

  try {
    await api.post('/', {  // Send POST request to create event
      title,
      description,
      date: isoDate,
      location,
      maxCapacity,
      price,
      imageUrl,
      category,
    });

    form.reset(); // clear form
    loadEvents(); // reload events
  } catch (err) {
    console.log(err.response?.data || err);
    alert('Failed to create event');
  }
});

// DELETE EVENT
async function deleteEvent(id) {     // Delete event by ID
  if (!confirm('Delete this event?')) return;

  try {
    await api.delete(`/${id}`); // send DELETE request
    loadEvents(); // refresh list
  } catch (err) {
    console.error(err.response?.data || err);
    alert('Delete failed');
  }
}

// EDIT EVENT
// Enable inline editing for a row
function enableEditMode(row) {
  const id = row.dataset.id;
  const event = allEvents.find((e) => e._id === id);

  // Replace row with editable inputs
  row.innerHTML = `
    <td><input value='${event.title}' class='edit-title'></td>
    <td><input type='date' value='${event.date.split('T')[0]}' class='edit-date'></td>
    <td><input value='${event.location}' class='edit-location'></td>
    <td><input type='number' value='${event.price}' class='edit-price'></td>
    <td><input type='number' value='${event.maxCapacity}' class='edit-capacity'></td>
    <td class='actions'>
      <button class='save-btn'>Save</button>
      <button class='cancel-btn'>Cancel</button>
    </td>
  `;

  // Save updated event
  row.querySelector('.save-btn').onclick = async () => {
    const updated = {
      ...event,
      title: row.querySelector('.edit-title').value,
      date: row.querySelector('.edit-date').value,
      location: row.querySelector('.edit-location').value,
      price: parseFloat(row.querySelector('.edit-price').value),
      maxCapacity: parseInt(row.querySelector('.edit-capacity').value, 10),
    };

    try {
      await api.put(`/${id}`, updated); // send PUT request
      loadEvents();
    } catch (err) {
      alert('Update failed');
    }
  };

  // Cancel editing and restore view
  row.querySelector('.cancel-btn').onclick = () => {
    renderEvents(allEvents);
  };
}

// RENDER EVENTS
// Render events into table
function renderEvents(events) {
  if (!events.length) {
    tbody.innerHTML = `<tr><td colspan='7'>No events</td></tr>`;
    return;
  }

  // Create table rows dynamically
  tbody.innerHTML = events
    .map((event) => {
      const spotsLeft = getSpotsLeft(event);

      return `
      <tr data-id='${event._id}'>
        <td>${event.title}</td>
        <td>${formatDate(event.date)}</td>
        <td>${event.location}</td>
        <td>${event.price} kr</td>
        <td>${spotsLeft <= 0 ? 'Sold out' : spotsLeft}</td>
        <td>
          <button class='edit-btn'>Edit</button>
          <button class='delete-btn'>Delete</button>
        </td>
      </tr>
    `;
    })
    .join('');

  attachListeners(); // attach button listeners
}

// BOOKINGS
function renderBookings(bookings) {                 // Render bookings table
  if (!bookings.length) {
    bookingsTbody.innerHTML = `<tr><td colspan='5'>No bookings</td></tr>`;
    return;
  }

  bookingsTbody.innerHTML = bookings
    .map((booking) => {
      return `
        <tr data-id='${booking._id}'>
          <td>
            ${booking.name || 'Unknown'}<br>
            <small>${booking.email || ''}</small>
          </td>
          <td>${booking.event?.title || 'No title'}</td>
          <td>${formatDate(booking.event?.date)}</td>
          <td>${booking.quantity || 1}</td>
          <td>
            <button class='edit-booking-btn'>Edit</button>
            <button class='delete-booking-btn'>Delete</button>
          </td>
        </tr>
      `;
    })
    .join('');

  attachBookingListeners(); // attach booking listeners
}

// Enable editing of booking quantity
function enableBookingEditMode(row) {
  const id = row.dataset.id;
  const booking = allBookings.find((b) => b._id === id);

  // Replace row with input field
  row.innerHTML = `
    <td>
      ${booking.name}<br>
      <small>${booking.email}</small>
    </td>
    <td>${booking.event?.title || 'No title'}</td>
    <td>${formatDate(booking.event?.date)}</td>
    <td>
      <input type='number' value='${booking.quantity}' class='edit-quantity'>
    </td>
    <td class='actions'>
      <button class='save-booking-btn'>Save</button>
      <button class='cancel-booking-btn'>Cancel</button>
    </td>
  `;

  // Save updated booking
  row.querySelector('.save-booking-btn').onclick = async () => {
    const updatedQuantity = parseInt(
      row.querySelector('.edit-quantity').value,
      10
    );

    try {
      await bookingsApi.put(`/${id}`, {
        ...booking,
        quantity: updatedQuantity,
      });

      loadBookings();
    } catch (err) {
      alert('Update booking failed');
    }
  };

  // Cancel editing
  row.querySelector('.cancel-booking-btn').onclick = () => {
    renderBookings(allBookings);
  };
}

// Delete booking
async function deleteBooking(id) {
  if (!confirm('Delete this booking?')) return;

  try {
    await bookingsApi.delete(`/${id}`);
    loadBookings();
  } catch (err) {
    alert('Delete booking failed');
  }
}

// LISTENERS
// Attach listeners to event buttons
function attachListeners() {
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.onclick = (e) => {
      deleteEvent(e.target.closest('tr').dataset.id);
    };
  });

  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.onclick = (e) => {
      enableEditMode(e.target.closest('tr'));
    };
  });
}

// Attach listeners to booking buttons
function attachBookingListeners() {
  document.querySelectorAll('.delete-booking-btn').forEach((btn) => {
    btn.onclick = (e) => {
      deleteBooking(e.target.closest('tr').dataset.id);
    };
  });

  document.querySelectorAll('.edit-booking-btn').forEach((btn) => {
    btn.onclick = (e) => {
      enableBookingEditMode(e.target.closest('tr'));
    };
  });
}

// LOAD
// Fetch and display events
async function loadEvents() {
  tbody.innerHTML = `<tr><td colspan='7'>Loading...</td></tr>`;

  try {
    const res = await api.get('/');
    allEvents = res.data;
    renderEvents(allEvents);
  } catch {
    tbody.innerHTML = `<tr><td colspan='7'>Failed to load</td></tr>`;
  }
}

// Fetch and display bookings
async function loadBookings() {
  bookingsTbody.innerHTML = `<tr><td colspan='5'>Loading...</td></tr>`;

  try {
    const res = await bookingsApi.get('/');
    allBookings = res.data;
    renderBookings(allBookings);
  } catch {
    bookingsTbody.innerHTML = `<tr><td colspan='5'>Failed to load</td></tr>`;
  }
}

// Run when page is loaded
document.addEventListener('DOMContentLoaded', async () => {
  await loadBookings(); // load bookings first
  await loadEvents();   // then load events
});