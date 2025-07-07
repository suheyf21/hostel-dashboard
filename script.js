// script.js

const roomData = [
  { type: "Room of One", count: 4, price: 1000000 },
  { type: "Room of Two", count: 66, price: 950000 },
  { type: "Room of Two (VIP)", count: 8, price: 1400000 },
  { type: "Room of Three", count: 1, price: 900000 },
  { type: "Room of Four", count: 1, price: 900000 }
];

let rooms = [];
roomData.forEach(group => {
  for (let i = 1; i <= group.count; i++) {
    rooms.push({
      id: `${group.type}-${i}`,
      number: i,
      type: group.type,
      price: group.price,
      tenant: null
    });
  }
});

let payments = [];
let expenses = 0;
let expenseRecords = [];

function renderRooms(list = rooms) {
  const roomList = document.getElementById("roomList");
  roomList.innerHTML = list.map(room => `
    <div class="room-card ${room.tenant ? 'occupied' : 'available'}">
      <h4>${room.type} - ${room.id}</h4>
      <p>₦${room.price}</p>
      <p>${room.tenant ? `🔴 Occupied by ${room.tenant.name} — Paid ₦${room.tenant.amount} on ${room.tenant.date}` : "🟢 Available"}</p>
      <button onclick='editRoom("${room.id}")'>${room.tenant ? "Update" : "Name of Student"}</button>
      ${room.tenant ? `<button class='reset-btn' onclick='resetRoom("${room.id}")'>Reset</button>` : ""}
    </div>
  `).join("");
}

function editRoom(id) {
  const room = rooms.find(r => r.id === id);
  const name = prompt("Tenant name:", room.tenant?.name || "");
  const amount = prompt("Amount paid:", room.tenant?.amount || room.price);
  const date = prompt("Date paid (YYYY-MM-DD):", room.tenant?.date || new Date().toISOString().slice(0,10));

  if (name && amount && date) {
    room.tenant = { name, amount: parseInt(amount), date };

    const paymentIndex = payments.findIndex(p => p.room === parseInt(room.number));
    if (paymentIndex !== -1) {
      payments[paymentIndex] = { room: parseInt(room.number), name, amount: parseInt(amount), date };
    } else {
      payments.push({ room: parseInt(room.number), name, amount: parseInt(amount), date });
    }

    saveRooms();
    saveData();
    updateSummary();
    renderRooms();

    // ✅ Add this line
    showNotification('Tenant assigned/updated successfully!');
  }
}


function resetRoom(id) {
  const room = rooms.find(r => r.id === id);
  if (!room.tenant) return;

  const paymentIndex = payments.findIndex(p => p.room === parseInt(room.number));
  if (paymentIndex !== -1) {
    payments.splice(paymentIndex, 1);
  }

  room.tenant = null;

  saveRooms();
  saveData();
  updateSummary();
  renderRooms();
}

function saveRooms() {
  localStorage.setItem("roomPayments", JSON.stringify(rooms));
}

function loadRooms() {
  const saved = JSON.parse(localStorage.getItem("roomPayments"));
  if (saved) rooms = saved;
}

function filterRooms() {
  const q = document.getElementById("roomSearch").value.toLowerCase();
  renderRooms(rooms.filter(r =>
    r.id.toLowerCase().includes(q) ||
    r.type.toLowerCase().includes(q) ||
    (r.tenant && r.tenant.name.toLowerCase().includes(q))
  ));
}

function updateSummary() {
  const income = payments.reduce((sum, p) => sum + p.amount, 0);
  expenses = expenseRecords.reduce((sum, e) => sum + e.amount, 0);

  document.getElementById('totalIncome').innerText = `₦${income}`;
  document.getElementById('totalExpense').innerText = `₦${expenses}`;
  document.getElementById('balance').innerText = `₦${income - expenses}`;
}

function addExpense() {
  const detail = document.getElementById('expenseDetail').value;
  const amount = parseInt(document.getElementById('expenseAmount').value);
  const date = new Date().toLocaleDateString();

  if (!detail || !amount) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  const expense = { detail, amount, date };
  expenseRecords.push(expense);
  saveData();
  renderExpenses();
  updateSummary();

  document.getElementById('expenseDetail').value = '';
  document.getElementById('expenseAmount').value = '';
}

function renderExpenses() {
  const list = document.getElementById('expenseList');
  list.innerHTML = '';
  expenseRecords.forEach((e, index) => {
    const item = document.createElement('li');
    item.textContent = `${e.detail} - ₦${e.amount} on ${e.date}`;

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑';
    delBtn.style.marginLeft = '10px';
    delBtn.onclick = () => {
      expenseRecords.splice(index, 1);
      saveData();
      renderExpenses();
      updateSummary();
    };

    item.appendChild(delBtn);
    list.appendChild(item);
  });
}

function saveData() {
  localStorage.setItem('payments', JSON.stringify(payments));
  localStorage.setItem('expenses', JSON.stringify(expenseRecords));
}

function loadData() {
  const paymentData = localStorage.getItem('payments');
  const expenseData = localStorage.getItem('expenses');

  if (paymentData) payments = JSON.parse(paymentData);
  if (expenseData) expenseRecords = JSON.parse(expenseData);

  renderExpenses();
  updateSummary();
}

function login() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  if (user === 'admin' && pass === '1234') {
    document.body.classList.remove('login-active');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    localStorage.setItem('loggedIn', 'true');
    loadData();
  } else {
    showNotification('Invalid credentials', 'error');
  }
}

function logout() {
  localStorage.removeItem('loggedIn');
  document.body.classList.add('login-active');
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
}

window.onload = function () {
  loadRooms();
  renderRooms();

  if (localStorage.getItem('loggedIn') === 'true') {
    document.body.classList.remove('login-active');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    loadData();
  } else {
    document.body.classList.add('login-active');
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
  }
};

function exportPayments() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Room,Name,Amount,Date\n";
  payments.forEach(p => {
    csvContent += `${p.room},${p.name},${p.amount},${p.date}\n`;
  });
  downloadCSV(csvContent, 'payments.csv');
}

function exportExpenses() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Detail,Amount,Date\n";
  expenseRecords.forEach(e => {
    csvContent += `${e.detail},${e.amount},${e.date}\n`;
  });
  downloadCSV(csvContent, 'expenses.csv');
}

function downloadCSV(content, filename) {
  const encodedUri = encodeURI(content);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function showNotification(message, type = 'success') {
  const container = document.getElementById('notification-container');
  const notif = document.createElement('div');
  notif.className = 'notification';
  if (type === 'error') notif.classList.add('error');
  if (type === 'info') notif.classList.add('info');
  notif.textContent = message;

  container.appendChild(notif);

  // Remove after 3 seconds
  setTimeout(() => {
    notif.style.opacity = '0';
    setTimeout(() => container.removeChild(notif), 500);
  }, 3000);
}
