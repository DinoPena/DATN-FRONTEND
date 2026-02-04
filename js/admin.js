// ================= AUTH GUARD =================
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user || user.role !== "admin") {
  alert("Bạn không có quyền truy cập trang admin");
  window.location.href = "login.html";
}

// ================= API =================
const API_URL = "http://localhost:3000/api/products";
const ORDER_API = "http://localhost:3000/api/orders";
const USER_API = "http://localhost:3000/api/users";

// ================= FETCH PRODUCTS =================
async function fetchProducts() {
  try {
    const res = await fetch(API_URL);
    const result = await res.json();

    if (!result.success) {
      alert("Không thể tải sản phẩm");
      return;
    }

    const products = result.data.products;
    const tbody = document.getElementById("productTableBody");
    tbody.innerHTML = "";

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">No products</td></tr>`;
      return;
    }

    products.forEach(product => {
      tbody.innerHTML += `
        <tr>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${product.brand}</td>
          <td style="
            max-width:250px;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            "title="${product.description || ""}">
            ${product.description || "-"}
          </td>
          <td>${product.stock}</td>
          <td>${product.price.toLocaleString()} VND</td>
          <td>
            ${
              product.image
                ? `
                  <img 
                    src="${product.image}" 
                    alt="preview"
                    style="width:50px;height:50px;object-fit:cover;border:1px solid #ccc;"
                  >
                  <br>
                  <span style="font-size:12px;color:#555;">
                    ${product.image}
                  </span>
                  &nbsp;
                  <a href="${product.image}" target="_blank" style="font-weight:bold;">
                    VIEW
                  </a>
                `
                : "No image"
            }
          </td>

          <td>
            <button onclick="editProduct('${product._id}')">Edit</button>
            <button onclick="deleteProduct('${product._id}')">Delete</button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

fetchProducts();

// ================= CREATE / UPDATE =================
document.getElementById("submitBtn").addEventListener("click", async () => {
  const id = document.getElementById("productId").value;

  const productData = {
    name: document.getElementById("name").value.trim(),
    category: document.getElementById("category").value.trim(),
    brand: document.getElementById("brand").value.trim(),
    description: document.getElementById("description").value.trim(),
    stock: Number(document.getElementById("stock").value),
    price: Number(document.getElementById("price").value),
    image: document.getElementById("image").value.trim()
  };

  if (!productData.name || !productData.category || !productData.brand) {
    alert("Vui lòng nhập đầy đủ thông tin");
    return;
  }

  try {
    const res = await fetch(
      id ? `${API_URL}/${id}` : API_URL,
      {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      }
    );

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Operation failed");
      return;
    }

    clearForm();
    fetchProducts();
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
});

// ================= EDIT =================
async function editProduct(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    const result = await res.json();

    if (!result.success) {
      alert("Không tìm thấy sản phẩm");
      return;
    }

    const product = result.data;

    document.getElementById("productId").value = product._id;
    document.getElementById("name").value = product.name;
    document.getElementById("category").value = product.category;
    document.getElementById("brand").value = product.brand;
    document.getElementById("description").value = product.description || "";
    document.getElementById("stock").value = product.stock;
    document.getElementById("price").value = product.price;
    document.getElementById("image").value = product.image || "";

    document.getElementById("submitBtn").innerText = "Update Product";
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

// ================= DELETE =================
async function deleteProduct(id) {
  if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Delete failed");
      return;
    }

    fetchProducts();
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");

imageInput.addEventListener("input", () => {
  const url = imageInput.value.trim();

  if (!url) {
    imagePreview.style.display = "none";
    imagePreview.src = "";
    return;
  }

  imagePreview.src = url;
  imagePreview.style.display = "block";

  imagePreview.onerror = () => {
    imagePreview.style.display = "none";
  };
});

// ================= CLEAR FORM =================
function clearForm() {
  document.getElementById("productId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("category").value = "";
  document.getElementById("brand").value = "";
  document.getElementById("description").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("price").value = "";
  document.getElementById("image").value = "";

  document.getElementById("submitBtn").innerText = "Add Product";
}

// ================= FETCH ORDERS =================
async function fetchOrders() {
  try {
    const res = await fetch(ORDER_API, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();

    if (!result.success) {
      alert("Không thể tải orders");
      return;
    }

    const orders = result.data;
    const tbody = document.getElementById("orderTableBody");
    tbody.innerHTML = "";

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No orders</td></tr>`;
      return;
    }

    orders.forEach(order => {
      const itemsHTML = order.items.map(item => {
        if (!item.product) {
          return `<span style="color:red">[Deleted product] × ${item.quantity}</span>`;
        }
        return `${item.product.name} × ${item.quantity}`;
      }).join("<br>");

      tbody.innerHTML += `
        <tr>
          <td>${order.user?.username || order.user?.email || "Unknown"}</td>
          <td>${itemsHTML}</td>
          <td>${order.totalAmount.toLocaleString()} VND</td>
          <td>
            <span style="
              font-weight:bold;
              color:${
                order.status === "pending"
                  ? "orange"
                  : order.status === "paid"
                  ? "green"
                  : "red"
              }
            ">
              ${order.status.toUpperCase()}
            </span>
          </td>
          <td>${new Date(order.createdAt).toLocaleString()}</td>
          <td>
            ${
              order.status === "pending"
                ? `
                  <button onclick="updateOrderStatus('${order._id}', 'paid')">Paid</button>
                  <button onclick="cancelOrder('${order._id}')">Cancel</button>
                `
                : "-"
            }
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}


//================== UPDATE ORDER STATUS =================
async function updateOrderStatus(orderId, status) {
  if (!confirm(`Xác nhận chuyển order sang "${status}"?`)) return;

  try {
    const res = await fetch(`${ORDER_API}/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Update failed");
      return;
    }

    fetchOrders();
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}
fetchOrders();

// ================= FETCH ACCOUNTS =================
async function fetchAccounts() {
  try {
    const res = await fetch("http://localhost:3000/api/users", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();
    if (!result.success) {
      alert("Không thể tải accounts");
      return;
    }

    const users = result.data;
    const tbody = document.getElementById("userTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    users.forEach(user => {
      tbody.innerHTML += `
        <tr>
          <td>${user.name || "No name"}</td>
          <td>${user.email}</td>
          <td>
            <select onchange="updateUserRole('${user._id}', this.value)">
              <option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
              <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
          </td>
          <td>
            ${user.isActive
              ? "<span style='color:green'>Active</span>"
              : "<span style='color:red'>Blocked</span>"
            }
          </td>
          <td>
            <button onclick="resetPassword('${user._id}')">Reset PW</button>

            <button onclick="toggleUserStatus('${user._id}')">
              ${user.isActive ? "Block" : "Unblock"}
            </button>

            ${
              user._id !== JSON.parse(localStorage.getItem("user"))._id
                ? `<button style="color:red" onclick="deleteUser('${user._id}')">Delete</button>`
                : "<em>You</em>"
            }
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}


//================== UPDATE USER ROLE =================
async function updateUserRole(userId, role) {
  if (!confirm(`Đổi role user thành "${role}"?`)) return;

  try {
    const res = await fetch(`${USER_API}/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Update role failed");
      return;
    }

    fetchAccounts();
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

//================== DELETE USER =================
async function deleteUser(userId) {
  if (!confirm("Xoá account này?")) return;

  try {
    const res = await fetch(`${USER_API}/${userId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Delete failed");
      return;
    }

    fetchAccounts();
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

fetchAccounts();

async function resetPassword(userId) {
  const newPassword = prompt("Nhập mật khẩu mới (>= 6 ký tự):");
  if (!newPassword) return;

  const res = await fetch(`http://localhost:3000/api/users/${userId}/reset-password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ newPassword })
  });

  const result = await res.json();
  if (!res.ok) {
    alert(result.message || "Reset failed");
    return;
  }

  alert("Reset mật khẩu thành công");
}

async function toggleUserStatus(userId) {
  if (!confirm("Bạn chắc chắn muốn thay đổi trạng thái user này?")) return;

  try {
    const res = await fetch(`${USER_API}/${userId}/toggle-status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const result = await res.json();
    if (!res.ok) {
      alert(result.message || "Operation failed");
      return;
    }

    fetchAccounts();
  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

const API_BASE = "http://localhost:3000/api";

async function adminFetch(url) {
  const token = localStorage.getItem("token");
  const res = await fetch(API_BASE + url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401 || res.status === 403) {
    alert("Session expired or account blocked");
    localStorage.clear();
    window.location.href = "login.html";
    throw new Error("UNAUTHORIZED");
  }

  return res.json();
}

async function loadOverview() {
  try {
    const res = await adminFetch("/admin/overview");
    console.log("Overview API response:", res); // 🔍 thêm dòng này

    if (!res.success) {
      console.error("Failed to load overview");
      return;
    }

    document.getElementById("total-products").innerText = res.data.products;
    document.getElementById("total-orders").innerText = res.data.orders;
    document.getElementById("total-users").innerText = res.data.users;

  } catch (err) {
    console.error("Load overview failed:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadOverview();
});

async function cancelOrder(orderId) {
  const reason = prompt("Enter cancel reason:");
  if (!reason) return;

  try {
    await apiFetch(`/orders/${orderId}/cancel`, {
      method: "PUT",
      body: JSON.stringify({ reason })
    });

    alert("Order cancelled");
    fetchOrders();
  } catch (err) {
    alert(err.message);
  }
}

async function fetchMessages() {
  try {
    const res = await fetch("http://localhost:3000/api/messages", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await res.json();

    if (!result.success) {
      alert("Không thể tải messages");
      return;
    }

    const messages = result.data;
    const tbody = document.getElementById("messageTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!messages.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center">No messages</td>
        </tr>
      `;
      return;
    }

    messages.forEach(m => {
      tbody.innerHTML += `
        <tr>
          <td>${m.name}</td>
          <td>${m.email}</td>
          <td>${new Date(m.createdAt).toLocaleString()}</td>
          <td style="max-width:300px; white-space:pre-wrap">
            ${m.message}
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

fetchMessages();






