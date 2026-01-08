const API_URL = "http://localhost:3000/api/auth";

// ================= BLOCK LOGIN PAGE IF LOGGED IN =================
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (token && user) {
  if (user.role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "index.html";
  }
}

// ================= LOGIN =================
document.getElementById("login-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Login failed");
      return;
    }

    // ✅ LƯU TOKEN
    localStorage.setItem("token", result.data.token);
    localStorage.setItem("user", JSON.stringify(result.data.user));

    alert("Login successful");
    if (result.data.user.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});

// ================= SIGNUP =================
document.getElementById("signup-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Signup failed");
      return;
    }

    alert("Signup successful, please login");
    document.getElementById("signup-form").reset();

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});

// ================= LOGOUT =================
function logout() {
  if (!localStorage.getItem("token")) {
    alert("You are not logged in");
    return;
  }

  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    alert("Logged out successfully");
    window.location.href = "login.html";
  }
}

// expose cho HTML
window.logout = logout;

