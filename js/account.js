const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");

// ================= API HELPER =================
async function apiFetch(url, options = {}) {
  const res = await fetch(API_BASE + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
    throw new Error("Unauthorized");
  }

  return res.json();
}

// ================= LOAD ACCOUNT =================
async function loadAccount() {
  try {
    const res = await apiFetch("/account/me");

    if (!res.success) return;

    document.getElementById("fullName").value = res.data.name;
    document.getElementById("email").value = res.data.email;
  } catch (err) {
    console.error(err);
  }
}

// ================= UPDATE INFO =================
async function updateInfo() {
  const name = document.getElementById("fullName").value.trim();
  if (!name) return alert("Name is required");

  const res = await apiFetch("/account/me", {
    method: "PATCH",
    body: JSON.stringify({ name })
  });

  if (res.success) alert("Updated successfully");
}

// ================= CHANGE PASSWORD =================
async function changePassword() {
  const pw = document.getElementById("newPassword").value;
  const confirm = document.getElementById("confirmPassword").value;

  if (!pw || pw.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  if (pw !== confirm) {
    alert("Password not match");
    return;
  }

  const res = await apiFetch("/account/change-password", {
    method: "PATCH",
    body: JSON.stringify({ newPassword: pw })
  });

  if (res.success) {
    alert("Password changed");
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
  }
}

// ================= LOAD MY ORDERS =================
async function loadMyOrders() {
  try {
    const res = await apiFetch("/orders/my-orders");
    const orders = res.data || [];

    const el = document.getElementById("order-list");
    if (!el) return;

    if (!orders.length) {
      el.innerHTML = "<p>No orders yet</p>";
      return;
    }

    el.innerHTML = orders.map(o => `
  <div style="margin-bottom:12px; padding:10px; border:1px solid #ddd">
    <strong>${new Date(o.createdAt).toLocaleString()}</strong><br>

    Total: ${o.totalAmount.toLocaleString()} VND<br>

    Status: 
    <b style="color:${o.status === "cancelled" ? "red" : "green"}">
      ${o.status}
    </b>

    ${
      o.status === "cancelled"
        ? `
          <div style="margin-top:6px; color:#b30000">
            <strong>Cancel reason:</strong> ${o.cancelledReason || "No reason provided"}
          </div>
        `
        : ""
    }
  </div>
`).join("");

  } catch (err) {
    console.error(err);
  }
}

// ================= SIDEBAR =================
function showPage(id, btn) {
  document.querySelectorAll(".page-section").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(id).classList.add("active");
  btn.classList.add("active");
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  loadAccount();
  loadMyOrders();
});
