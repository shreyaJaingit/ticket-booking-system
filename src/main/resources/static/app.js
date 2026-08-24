/**
 * CinePass — Cinema Ticket Booking System Frontend
 * Vanilla Modern ES6+ Application
 */

const STATE = {
  showId: 'SHOW001',
  currentUserId: 'user1',
  seats: [],
  selectedSeatNumber: null,
  waitlist: [],
  userBookings: [],
  autoRefreshEnabled: true,
  refreshTimer: null,
  countdownTimer: null
};

// API Base (relative for same-origin Spring Boot serving or proxy)
const API_BASE = '';

// =============================================================================
// Initialization
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initUIEventListeners();
  startCountdownClock();
  fetchAllData();
  startAutoRefresh();
});

function initUIEventListeners() {
  // Auto-refresh toggle
  const toggle = document.getElementById('auto-refresh-toggle');
  toggle.addEventListener('change', (e) => {
    STATE.autoRefreshEnabled = e.target.checked;
    if (STATE.autoRefreshEnabled) {
      startAutoRefresh();
      showToast('Live Sync', 'Auto-refresh enabled (3s)', 'info');
    } else {
      stopAutoRefresh();
      showToast('Live Sync', 'Auto-refresh paused', 'info');
    }
  });

  // Manual refresh button
  document.getElementById('btn-refresh').addEventListener('click', () => {
    fetchAllData(true);
  });

  // User Profile Switcher Buttons
  const userPills = document.querySelectorAll('.user-pill');
  userPills.forEach(pill => {
    pill.addEventListener('click', () => {
      userPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const user = pill.getAttribute('data-user');
      setUser(user);
    });
  });

  // Custom User ID Input
  const customInput = document.getElementById('custom-user-id');
  customInput.addEventListener('change', (e) => {
    const val = e.target.value.trim();
    if (val) {
      userPills.forEach(p => p.classList.remove('active'));
      setUser(val);
    }
  });

  // Action Buttons
  document.getElementById('btn-hold').addEventListener('click', handleHoldSeat);
  document.getElementById('btn-book').addEventListener('click', handleBookSeat);
  document.getElementById('btn-cancel').addEventListener('click', handleCancelBooking);
  document.getElementById('btn-waitlist').addEventListener('click', () => {
    if (STATE.selectedSeatNumber) {
      handleJoinWaitlist(STATE.selectedSeatNumber);
    }
  });

  // Direct Waitlist Button from panel
  document.getElementById('btn-direct-waitlist').addEventListener('click', () => {
    const select = document.getElementById('waitlist-seat-select');
    const seatNum = select.value;
    if (seatNum) {
      handleJoinWaitlist(seatNum);
    }
  });

  // Refresh User Bookings
  document.getElementById('btn-refresh-bookings').addEventListener('click', fetchUserBookings);

  // Clear Activity Log
  document.getElementById('btn-clear-activity').addEventListener('click', () => {
    const log = document.getElementById('activity-log');
    log.innerHTML = `
      <div class="log-entry info">
        <span class="log-time">${getCurrentTimeString()}</span>
        <span class="log-text">Activity log cleared.</span>
      </div>`;
  });
}

function setUser(userId) {
  STATE.currentUserId = userId;
  document.getElementById('custom-user-id').value = userId;
  document.getElementById('user-booking-id').textContent = userId;
  logActivity(`Switched active user to "${userId}"`, 'info');
  showToast('User Changed', `Active profile is now ${userId}`, 'info');
  updateActionPanel();
  fetchUserBookings();
}

// =============================================================================
// Data Fetching & Polling
// =============================================================================

async function fetchAllData(isManual = false) {
  try {
    await Promise.all([
      fetchSeats(),
      fetchWaitlist(),
      fetchUserBookings()
    ]);
    if (isManual) {
      showToast('Refreshed', 'Seating and booking data updated', 'info');
    }
  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  STATE.refreshTimer = setInterval(() => {
    if (STATE.autoRefreshEnabled) {
      fetchAllData(false);
    }
  }, 3000);
}

function stopAutoRefresh() {
  if (STATE.refreshTimer) {
    clearInterval(STATE.refreshTimer);
    STATE.refreshTimer = null;
  }
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchSeats() {
  try {
    const res = await fetch(`${API_BASE}/api/shows/${STATE.showId}/seats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch seats`);
    const seats = await res.json();
    STATE.seats = seats;
    renderSeats(seats);
    updateKPIs(seats);
    updateWaitlistSelectOptions(seats);
    updateActionPanel();
  } catch (err) {
    console.error('Failed to load seats:', err);
  }
}

async function fetchWaitlist() {
  try {
    // Fetch waitlist for all seats in show
    const seats = STATE.seats.length > 0 ? STATE.seats : [{ seatNumber: 'A1' }, { seatNumber: 'A2' }, { seatNumber: 'A3' }];
    const promises = seats.map(s =>
      fetch(`${API_BASE}/api/waitlist?showId=${STATE.showId}&seatNumber=${s.seatNumber}`)
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
    );
    const results = await Promise.all(promises);
    const combinedWaitlist = results.flat();
    STATE.waitlist = combinedWaitlist;
    renderWaitlist(combinedWaitlist);
    document.getElementById('kpi-waitlist').textContent = combinedWaitlist.length;
  } catch (err) {
    console.error('Failed to load waitlist:', err);
  }
}

async function fetchUserBookings() {
  try {
    const res = await fetch(`${API_BASE}/api/bookings?userId=${encodeURIComponent(STATE.currentUserId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch bookings`);
    const bookings = await res.json();
    STATE.userBookings = bookings;
    renderUserBookings(bookings);
  } catch (err) {
    console.error('Failed to load user bookings:', err);
  }
}

// =============================================================================
// User Action Handlers
// =============================================================================

async function handleHoldSeat() {
  if (!STATE.selectedSeatNumber) {
    showToast('Selection Required', 'Please click on a seat first.', 'warning');
    return;
  }

  const seatNum = STATE.selectedSeatNumber;
  const userId = STATE.currentUserId;

  try {
    logActivity(`Holding seat ${seatNum} for ${userId}...`, 'info');
    const res = await fetch(
      `${API_BASE}/api/shows/${STATE.showId}/seats/${seatNum}/hold?userId=${encodeURIComponent(userId)}`,
      { method: 'POST' }
    );

    if (!res.ok) {
      const errorMsg = await parseBackendError(res);
      showToast('Hold Failed', errorMsg, 'error');
      logActivity(`Hold failed for seat ${seatNum}: ${errorMsg}`, 'error');
      return;
    }

    const updatedSeat = await res.json();
    showToast('Seat Held!', `Seat ${seatNum} is held for 5 minutes. Confirm booking now.`, 'warning');
    logActivity(`Seat ${seatNum} held successfully by ${userId}`, 'warning');
    await fetchAllData();
  } catch (err) {
    showToast('Network Error', err.message || 'Unable to connect to backend.', 'error');
  }
}

async function handleBookSeat() {
  if (!STATE.selectedSeatNumber) {
    showToast('Selection Required', 'Please select a held seat first.', 'warning');
    return;
  }

  const seatNum = STATE.selectedSeatNumber;
  const userId = STATE.currentUserId;

  try {
    logActivity(`Booking seat ${seatNum} for ${userId}...`, 'info');
    
    // We can use the SeatController booking endpoint:
    const res = await fetch(
      `${API_BASE}/api/shows/${STATE.showId}/seats/${seatNum}/book?userId=${encodeURIComponent(userId)}`,
      { method: 'POST' }
    );

    if (!res.ok) {
      const errorMsg = await parseBackendError(res);
      showToast('Booking Failed', errorMsg, 'error');
      logActivity(`Booking failed for seat ${seatNum}: ${errorMsg}`, 'error');
      return;
    }

    const result = await res.json();
    showToast('Booking Confirmed! 🎉', `Seat ${seatNum} has been successfully booked for ${userId}.`, 'success');
    logActivity(`Seat ${seatNum} BOOKED successfully by ${userId}!`, 'success');
    
    // Also record in Booking collection if not already recorded
    try {
      await fetch(
        `${API_BASE}/api/bookings?showId=${STATE.showId}&seatNumber=${seatNum}&userId=${encodeURIComponent(userId)}`,
        { method: 'POST' }
      );
    } catch (_) {}

    await fetchAllData();
  } catch (err) {
    showToast('Network Error', err.message || 'Unable to connect to backend.', 'error');
  }
}

async function handleCancelBooking(seatNumberParam) {
  const seatNum = typeof seatNumberParam === 'string' ? seatNumberParam : STATE.selectedSeatNumber;
  if (!seatNum) {
    showToast('Selection Required', 'Please select a booked seat to cancel.', 'warning');
    return;
  }

  const userId = STATE.currentUserId;

  try {
    logActivity(`Cancelling booking for seat ${seatNum}...`, 'info');
    const res = await fetch(
      `${API_BASE}/api/shows/${STATE.showId}/seats/${seatNum}/cancel?userId=${encodeURIComponent(userId)}`,
      { method: 'POST' }
    );

    if (!res.ok) {
      const errorMsg = await parseBackendError(res);
      showToast('Cancellation Failed', errorMsg, 'error');
      logActivity(`Cancellation failed for seat ${seatNum}: ${errorMsg}`, 'error');
      return;
    }

    const updatedSeat = await res.json();
    if (updatedSeat.status === 'HELD') {
      showToast('Booking Cancelled', `Seat ${seatNum} cancelled and auto-assigned to waitlisted user "${updatedSeat.heldBy}"!`, 'info');
      logActivity(`Seat ${seatNum} booking cancelled; reassigned to waitlist user "${updatedSeat.heldBy}" (HELD)`, 'purple');
    } else {
      showToast('Booking Cancelled', `Seat ${seatNum} has been returned to AVAILABLE.`, 'success');
      logActivity(`Seat ${seatNum} booking cancelled. Now AVAILABLE.`, 'info');
    }

    await fetchAllData();
  } catch (err) {
    showToast('Network Error', err.message || 'Unable to connect to backend.', 'error');
  }
}

async function handleJoinWaitlist(seatNum) {
  if (!seatNum) {
    showToast('Seat Required', 'Please specify a seat to join the waitlist.', 'warning');
    return;
  }

  const userId = STATE.currentUserId;

  try {
    logActivity(`Joining waitlist for seat ${seatNum} as ${userId}...`, 'info');
    const res = await fetch(
      `${API_BASE}/api/waitlist?showId=${STATE.showId}&seatNumber=${seatNum}&userId=${encodeURIComponent(userId)}`,
      { method: 'POST' }
    );

    if (!res.ok) {
      const errorMsg = await parseBackendError(res);
      showToast('Waitlist Error', errorMsg, 'error');
      logActivity(`Waitlist join failed for ${seatNum}: ${errorMsg}`, 'error');
      return;
    }

    const waitlistEntry = await res.json();
    showToast('Waitlist Joined!', `You are in line for Seat ${seatNum}. You will get first priority upon cancellation.`, 'info');
    logActivity(`User "${userId}" joined waitlist queue for Seat ${seatNum}`, 'purple');
    await fetchAllData();
  } catch (err) {
    showToast('Network Error', err.message || 'Unable to connect to backend.', 'error');
  }
}

// =============================================================================
// Error Handling & Parsing
// =============================================================================

async function parseBackendError(response) {
  try {
    const errorJson = await response.json();
    const rawMsg = errorJson.message || errorJson.error || '';
    
    // Map known backend exceptions to clean, user-friendly messages
    if (rawMsg.includes('Seat not found')) return 'Seat not found in database.';
    if (rawMsg.includes('Seat is not available')) return 'Seat is already booked or held by another user.';
    if (rawMsg.includes('Seat is not held')) return 'Seat must be held before booking.';
    if (rawMsg.includes('Seat is held by another user')) return 'Seat is held by another customer. Join the waitlist for priority.';
    if (rawMsg.includes('Seat hold has expired')) return 'Your seat hold has expired (5 minute limit).';
    if (rawMsg.includes('Seat is not booked')) return 'This seat is not currently booked.';

    if (rawMsg.length > 0 && rawMsg.length < 100) return rawMsg;
    return `Request failed (HTTP ${response.status})`;
  } catch (_) {
    return `Server error (HTTP ${response.status})`;
  }
}

// =============================================================================
// DOM Rendering Functions
// =============================================================================

function renderSeats(seats) {
  const container = document.getElementById('seats-container');
  if (!seats || seats.length === 0) {
    container.innerHTML = `<div class="empty-list">No seats found for show ${STATE.showId}.</div>`;
    return;
  }

  // Sort seats alphanumerically
  const sorted = [...seats].sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));

  let html = '<div class="seats-grid">';
  sorted.forEach(seat => {
    const status = (seat.status || 'AVAILABLE').toUpperCase();
    const isSelected = STATE.selectedSeatNumber === seat.seatNumber;
    const statusClass = status.toLowerCase();
    
    let icon = '💺';
    if (status === 'HELD') icon = '⏱️';
    if (status === 'BOOKED') icon = '🔒';

    // Hold time calculations
    let timerHtml = '';
    let holderHtml = '';
    if (status === 'HELD') {
      const remainingSeconds = getRemainingSeconds(seat.holdExpiresAt);
      timerHtml = `<div class="seat-timer" data-expires="${seat.holdExpiresAt || ''}">${formatTime(remainingSeconds)}</div>`;
      if (seat.heldBy) {
        holderHtml = `<div class="seat-holder" title="Held by ${seat.heldBy}">👤 ${seat.heldBy}</div>`;
      }
    }

    html += `
      <div class="seat-box ${statusClass} ${isSelected ? 'selected' : ''}" 
           data-seat="${seat.seatNumber}" 
           onclick="selectSeat('${seat.seatNumber}')">
        <div class="seat-icon">${icon}</div>
        <div class="seat-number">${seat.seatNumber}</div>
        <div class="seat-status-tag">${status}</div>
        ${timerHtml}
        ${holderHtml}
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

window.selectSeat = function(seatNumber) {
  if (STATE.selectedSeatNumber === seatNumber) {
    // toggle off
    STATE.selectedSeatNumber = null;
  } else {
    STATE.selectedSeatNumber = seatNumber;
  }
  renderSeats(STATE.seats);
  updateActionPanel();
};

function updateKPIs(seats) {
  const total = seats.length;
  const available = seats.filter(s => s.status === 'AVAILABLE').length;
  const held = seats.filter(s => s.status === 'HELD').length;
  const booked = seats.filter(s => s.status === 'BOOKED').length;

  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-available').textContent = available;
  document.getElementById('kpi-held').textContent = held;
  document.getElementById('kpi-booked').textContent = booked;
}

function updateWaitlistSelectOptions(seats) {
  const select = document.getElementById('waitlist-seat-select');
  const currentVal = select.value;
  const sorted = [...seats].sort((a, b) => a.seatNumber.localeCompare(b.seatNumber));
  
  select.innerHTML = sorted.map(s => 
    `<option value="${s.seatNumber}" ${s.seatNumber === currentVal ? 'selected' : ''}>Seat ${s.seatNumber} (${s.status})</option>`
  ).join('');
}

function updateActionPanel() {
  const badge = document.getElementById('selected-seat-badge');
  const noSeatPrompt = document.getElementById('no-seat-prompt');
  const detailsPanel = document.getElementById('seat-details-panel');

  if (!STATE.selectedSeatNumber) {
    badge.textContent = 'No Seat Selected';
    badge.className = 'badge';
    noSeatPrompt.classList.remove('hidden');
    detailsPanel.classList.add('hidden');
    return;
  }

  const seat = STATE.seats.find(s => s.seatNumber === STATE.selectedSeatNumber);
  if (!seat) return;

  noSeatPrompt.classList.add('hidden');
  detailsPanel.classList.remove('hidden');

  const status = (seat.status || 'AVAILABLE').toUpperCase();
  badge.textContent = `Seat ${seat.seatNumber} (${status})`;
  badge.className = `badge ${status.toLowerCase()}`;

  document.getElementById('detail-seat-num').textContent = seat.seatNumber;
  
  const statusPill = document.getElementById('detail-seat-status');
  statusPill.textContent = status;
  statusPill.className = `status-pill ${status.toLowerCase()}`;

  const holderRow = document.getElementById('detail-holder-row');
  const heldBySpan = document.getElementById('detail-held-by');
  const expiryRow = document.getElementById('detail-expiry-row');
  const expirySpan = document.getElementById('detail-expiry-time');

  const btnHold = document.getElementById('btn-hold');
  const btnBook = document.getElementById('btn-book');
  const btnCancel = document.getElementById('btn-cancel');
  const btnWaitlist = document.getElementById('btn-waitlist');
  const tip = document.getElementById('context-tip');

  // Reset display
  holderRow.style.display = 'none';
  expiryRow.style.display = 'none';
  btnHold.disabled = true;
  btnBook.disabled = true;
  btnCancel.disabled = true;
  btnWaitlist.disabled = false;

  const isHeldByMe = (status === 'HELD' && seat.heldBy === STATE.currentUserId);
  const isHeldByOther = (status === 'HELD' && seat.heldBy !== STATE.currentUserId);

  if (status === 'AVAILABLE') {
    btnHold.disabled = false;
    btnBook.disabled = true;
    btnCancel.disabled = true;
    btnWaitlist.disabled = false;
    tip.innerHTML = `💡 Seat <strong>${seat.seatNumber}</strong> is ready for selection. Click <strong>Hold Seat</strong> to reserve it for 5 minutes.`;
  } else if (status === 'HELD') {
    holderRow.style.display = 'flex';
    heldBySpan.textContent = seat.heldBy || 'Unknown';
    expiryRow.style.display = 'flex';
    const rem = getRemainingSeconds(seat.holdExpiresAt);
    expirySpan.textContent = formatTime(rem);

    if (isHeldByMe) {
      btnHold.disabled = true;
      btnBook.disabled = false;
      btnCancel.disabled = true;
      tip.innerHTML = `⭐ You are currently holding seat <strong>${seat.seatNumber}</strong>. Click <strong>Confirm Booking</strong> before the timer expires!`;
    } else {
      btnHold.disabled = true;
      btnBook.disabled = true;
      btnCancel.disabled = true;
      tip.innerHTML = `🔒 Seat <strong>${seat.seatNumber}</strong> is held by <strong>${seat.heldBy}</strong>. Join the waitlist to receive priority if the hold expires or is cancelled.`;
    }
  } else if (status === 'BOOKED') {
    btnHold.disabled = true;
    btnBook.disabled = true;
    btnCancel.disabled = false;
    btnWaitlist.disabled = false;
    tip.innerHTML = `🎟️ Seat <strong>${seat.seatNumber}</strong> is confirmed BOOKED. You can cancel this booking or join the waitlist queue.`;
  }
}

function renderWaitlist(waitlistItems) {
  const container = document.getElementById('waitlist-items-container');
  const badge = document.getElementById('waitlist-count-badge');
  badge.textContent = `${waitlistItems.length} in queue`;

  if (!waitlistItems || waitlistItems.length === 0) {
    container.innerHTML = '<p class="empty-list">No users currently in the waitlist queue.</p>';
    return;
  }

  let html = '';
  waitlistItems.forEach((item, index) => {
    const timeFormatted = item.joinedAt ? new Date(item.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now';
    html += `
      <div class="waitlist-item">
        <div>
          <span class="waitlist-pos">#${index + 1}</span>
          <span class="waitlist-user">👤 ${item.userId}</span>
        </div>
        <div>
          <span class="waitlist-seat">Seat ${item.seatNumber}</span>
          <span class="waitlist-time">${timeFormatted}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderUserBookings(bookings) {
  const container = document.getElementById('user-bookings-list');
  if (!bookings || bookings.length === 0) {
    container.innerHTML = `<p class="empty-list">No confirmed bookings found for ${STATE.currentUserId}.</p>`;
    return;
  }

  let html = '';
  bookings.forEach(b => {
    const timeFormatted = b.bookedAt ? new Date(b.bookedAt).toLocaleString() : 'Confirmed';
    html += `
      <div class="booking-item">
        <div class="booking-details">
          <span class="booking-seat">Seat ${b.seatNumber} • ${b.showId}</span>
          <span class="booking-time">${timeFormatted} (Status: ${b.status || 'CONFIRMED'})</span>
        </div>
        <button class="btn btn-danger btn-sm" onclick="handleCancelBooking('${b.seatNumber}')">
          Cancel Ticket
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

// =============================================================================
// Real-time Countdown Timer Engine
// =============================================================================

function startCountdownClock() {
  if (STATE.countdownTimer) clearInterval(STATE.countdownTimer);

  STATE.countdownTimer = setInterval(() => {
    // Update any timer tags in seat boxes
    const timerElements = document.querySelectorAll('.seat-timer');
    let hasExpiredSeat = false;

    timerElements.forEach(el => {
      const expiresAt = el.getAttribute('data-expires');
      if (expiresAt) {
        const rem = getRemainingSeconds(expiresAt);
        el.textContent = formatTime(rem);
        if (rem <= 0) hasExpiredSeat = true;
      }
    });

    // Update active drawer timer
    if (STATE.selectedSeatNumber) {
      const seat = STATE.seats.find(s => s.seatNumber === STATE.selectedSeatNumber);
      if (seat && seat.status === 'HELD' && seat.holdExpiresAt) {
        const expirySpan = document.getElementById('detail-expiry-time');
        if (expirySpan) {
          const rem = getRemainingSeconds(seat.holdExpiresAt);
          expirySpan.textContent = formatTime(rem);
        }
      }
    }

    // If a hold reached 0, trigger immediate poll
    if (hasExpiredSeat) {
      fetchSeats();
    }
  }, 1000);
}

function getRemainingSeconds(isoString) {
  if (!isoString) return 0;
  const diff = new Date(isoString).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getCurrentTimeString() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// =============================================================================
// Activity Logger
// =============================================================================

function logActivity(text, type = 'info') {
  const log = document.getElementById('activity-log');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `
    <span class="log-time">${getCurrentTimeString()}</span>
    <span class="log-text">${escapeHtml(text)}</span>
  `;
  log.prepend(entry);

  // Keep max 25 entries
  while (log.children.length > 25) {
    log.removeChild(log.lastChild);
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// =============================================================================
// Toast Notification Engine
// =============================================================================

function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}
