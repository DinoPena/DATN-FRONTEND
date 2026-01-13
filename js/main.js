// ================= CONFIG =================
const API_BASE_URL = "http://localhost:3000/api";

// ================= TOKEN =================
function saveToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// ================= API HELPER =================
async function apiFetch(url, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_BASE_URL + url, {
    ...options,
    headers
  });

  if (res.status === 403) {
    alert("Tài khoản đã bị khóa");
    localStorage.clear();
    window.location.href = "login.html";
    throw new Error("ACCOUNT_BLOCKED"); // ✅ QUAN TRỌNG
  }

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "API error");
  }

  return res.json();
}

// ================= SEARCH =================
function handleSearch(e) {
  if (e.key !== "Enter") return;

  const keyword = e.target.value.trim();
  if (!keyword) return;

  window.location.href = `shop.html?search=${encodeURIComponent(keyword)}`;
}

// ================= CART =================
document.addEventListener("click", function (e) {
  const btn = e.target.closest(".add-to-cart");
  if (!btn) return;

  e.preventDefault();

  // 🔒 CHẶN SẢN PHẨM LỖI (BẮT BUỘC)
  const id = btn.dataset.id;
  const name = btn.dataset.name;
  const price = Number(btn.dataset.price);
  const stock = Number(btn.dataset.stock);
  const image = btn.dataset.image;

  if (!id || !name || !price || isNaN(stock) || stock <= 0) {
    console.warn("Invalid product button:", btn);
    alert("This product is invalid and cannot be added to cart");
    return;
  }

  let cart = getCart();
  let existing = cart.find(i => i.productId === btn.dataset.id);

  // ❌ ĐÃ TỒN TẠI & VƯỢT STOCK
  if (existing && existing.quantity >= stock) {
    alert("Cannot add more. Reached stock limit.");
    return;
  }

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      productId: btn.dataset.id,
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
      image: btn.dataset.image,
      stock: stock, // ⭐ LƯU STOCK
      quantity: 1
    });
  }

  saveCart(cart);
  updateCartCount();
  alert("Added to cart");
});


// ================= SHOP PAGE =================
async function loadProducts(page = 1) {
  const listEl = document.getElementById("product-list");
  const paginationEl = document.getElementById("pagination");
  if (!listEl) return;

  const params = new URLSearchParams(window.location.search);

  params.set("page", page);
  params.set("limit", 15);

  try {
    const res = await apiFetch(`/products?${params.toString()}`);

    const { products, pagination } = res.data;

    // render products
    listEl.innerHTML = products.map(p => renderProductCard(p)).join("");

    // render pagination
    paginationEl.innerHTML = "";
    for (let i = 1; i <= pagination.totalPages; i++) {
      paginationEl.innerHTML += `
        <li class="${i === pagination.page ? "active" : ""}">
          <a href="#" onclick="changePage(${i})">${i}</a>
        </li>
      `;
    }

  } catch (err) {
    console.error(err);
    listEl.innerHTML = "<p>Cannot load products</p>";
  }
}

function changePage(page) {
  loadProducts(page);
}


// ================= ORDER =================
async function createOrder() {
  const cart = getCart();
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const token = getToken();
  if (!token) {
    alert("You need to login");
    window.location.href = "login.html";
    return;
  }

  const items = cart.map(i => ({
    product: i.productId,
    quantity: i.quantity,
    price: i.price
  }));

  const res = await apiFetch("/orders", {
    method: "POST",
    body: JSON.stringify({ items, paymentMethod: "COD" })
  });

  if (!res.success) {
    alert(res.message || "Create order failed");
    return;
  }

  localStorage.removeItem("cart");
  alert("Order created successfully");
  window.location.href = "index.html";
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();            // shop.html
  loadFeaturedItems();       // index.html
  loadRecommendedItems();    // index.html
  loadCategoryTabs();        // index.html
});

// ================= HOME =================
function renderProductCard(p) {
  return `
    <div class="col-sm-4">
      <div class="product-image-wrapper">
        <div class="single-products">
          <div class="productinfo text-center">
            <img src="${p.image || 'images/shop/product1.jpg'}" />

            <h2>${p.price.toLocaleString()} VND</h2>
            <p>${p.name}</p>

            <a href="product-details.html?id=${p._id}" class="btn btn-default">
              View details
            </a>

            ${
              p.stock > 0
                ? `
                  <a href="#"
                     class="btn btn-default add-to-cart"
                     data-id="${p._id}"
                     data-name="${p.name}"
                     data-price="${p.price}"
                     data-image="${p.image || 'images/shop/product1.jpg'}"
                     data-stock="${p.stock}">
                    Add to cart
                  </a>
                `
                : `
                  <button class="btn btn-default disabled" disabled>
                    Out of stock
                  </button>
                `
            }

          </div>
        </div>
      </div>
    </div>
  `;
}


async function loadFeaturedItems() {
  const featureEl = document.getElementById("feature-list");
  if (!featureEl) return;

  try {
    const res = await apiFetch("/products?limit=20");
    const products = res.data.products || [];

    const featured = products.slice(0, 6);

    featureEl.innerHTML = featured
      .map(p => renderProductCard(p))
      .join("");
  } catch (err) {
    console.error(err);
    featureEl.innerHTML = "<p>Cannot load featured products</p>";
  }
}

async function loadRecommendedItems() {
  const recommendEl = document.getElementById("recommend-list");
  if (!recommendEl) return;

  try {
    const res = await apiFetch("/products?limit=30");
    const products = res.data.products || [];

    const recommended = products.slice(0, 12);

    let html = "";
    for (let i = 0; i < recommended.length; i += 3) {
      const group = recommended.slice(i, i + 3);

      html += `
        <div class="item ${i === 0 ? "active" : ""}">
          ${group.map(p => renderProductCard(p)).join("")}
        </div>
      `;
    }

    recommendEl.innerHTML = html;
  } catch (err) {
    console.error(err);
    recommendEl.innerHTML = "<p>Cannot load recommended products</p>";
  }
}

async function loadCategoryTabs() {
  const res = await apiFetch("/products?limit=100");
  const products = res.data.products || [];

  const map = {
    speaker: "tab-speaker",
    amplifier: "tab-amplifier",
    microphone: "tab-microphone",
    "noise-filter": "tab-noise-filter",
    accessories: "tab-accessories"
  };

  Object.entries(map).forEach(([category, elId]) => {
    const el = document.getElementById(elId);
    if (!el) return;

    const items = products
      .filter(p => p.category === category)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    el.innerHTML = items.length
      ? items.map(p => renderProductCard(p)).join("")
      : `<p class="text-center">No products</p>`;
  });
}


function goAccount() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You need to login first!!!");
    window.location.href = "login.html";
    return;
  }
  window.location.href = "account.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const loginLink = document.querySelector('a[href="login.html"].active');
  const logoutLink = document.querySelector('a[onclick="logout()"]');

  const isLoggedIn = !!localStorage.getItem("token");

  if (loginLink) loginLink.parentElement.style.display = isLoggedIn ? "none" : "block";
  if (logoutLink) logoutLink.parentElement.style.display = isLoggedIn ? "block" : "none";
  if (typeof updateCartCount === "function") { updateCartCount(); }
});

// ================= CHATBOT LOGIC =================

// Hàm đóng/mở khung chat
function toggleChat() {
    const box = document.getElementById('chat-box');
    const circle = document.getElementById('chat-circle');
    
    // Kiểm tra trạng thái hiện tại dựa trên style computed hoặc mặc định
    if (box.style.display === 'flex') {
        box.style.display = 'none';
        circle.style.display = 'flex';
    } else {
        box.style.display = 'flex'; // Phải là flex để các thành phần con hiển thị đúng
        circle.style.display = 'none';
        
        // Cuộn xuống đáy ngay khi mở khung chat để thấy tin mới nhất
        scrollChatToBottom();
    }
}

// Hàm cuộn xuống dưới cùng
function scrollChatToBottom() {
    const chatContent = document.getElementById("chat-content");
    // Sử dụng setTimeout để đảm bảo DOM đã render xong tin nhắn mới
    setTimeout(() => {
        chatContent.scrollTo({
            top: chatContent.scrollHeight,
            behavior: 'smooth' // Cuộn mượt mà hơn
        });
    }, 50);
}

// Xử lý khi nhấn Enter
function handleChatEnter(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
}

function sendMessage() {
    const input = document.getElementById("user-msg");
    const chatContent = document.getElementById("chat-content");
    const message = input.value.trim();

    if (!message) return;

    // Tin nhắn của Người dùng
    chatContent.innerHTML += `
        <div class="msg user-msg">${message}</div>
    `;
    input.value = "";
    scrollChatToBottom(); // Cuộn sau khi user gửi

    // Gửi đến server
    fetch("http://localhost:3000/api/chatbot", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
    })
    .then(res => res.json())
    .then(data => {
        // Tin nhắn của Bot
        chatContent.innerHTML += `
            <div class="msg bot-msg">${data.reply}</div>
        `;
        scrollChatToBottom(); // Cuộn sau khi bot trả lời
    })
    .catch(err => {
        chatContent.innerHTML += `
            <div class="msg error-msg">Server error. Please try again sau.</div>
        `;
        scrollChatToBottom();
    });
}
