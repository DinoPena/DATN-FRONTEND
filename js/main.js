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
  const headers = {
    "Content-Type": "application/json"
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(API_BASE_URL + url, {
    ...options,
    headers
  });

  return res.json();
}

// ================= SEARCH =================
function handleSearch(e) {
  if (e.key !== "Enter") return;

  const keyword = e.target.value.trim();
  if (!keyword) return;

  window.location.href = `shop.html?search=${encodeURIComponent(keyword)}`;
}

// ================= AUTH =================
async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if (res.token) {
    saveToken(res.token);
    alert("Login successful");
    window.location.href = "index.html";
  } else {
    alert(res.message || "Invalid email or password");
  }
}

async function register() {
  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;

  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password })
  });

  if (res.success) {
    alert("Register successful. Please login.");
  } else {
    alert(res.message || "Register failed");
  }
}

// ================= CART =================
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

document.addEventListener("click", function (e) {
  const btn = e.target.closest(".add-to-cart");
  if (!btn) return;

  e.preventDefault();

  const product = {
    product: btn.dataset.id,
    name: btn.dataset.name,
    price: Number(btn.dataset.price),
    image: btn.dataset.image,
    quantity: 1
  };

  let cart = getCart();
  const existing = cart.find(i => i.product === product.product);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push(product);
  }

  saveCart(cart);
  alert("Added to cart");
});

// ================= SHOP PAGE =================
async function loadProducts() {
  const listEl = document.getElementById("product-list");
  if (!listEl) return;

  const params = new URLSearchParams(window.location.search);

  const search = params.get("search");
  const category = params.get("category");
  const brand = params.get("brand");

  let query = [];
  if (search) query.push(`search=${encodeURIComponent(search)}`);
  if (category) query.push(`category=${encodeURIComponent(category)}`);
  if (brand) query.push(`brand=${encodeURIComponent(brand)}`);

  const url = `/products${query.length ? "?" + query.join("&") : ""}`;

  try {
    const res = await apiFetch(url);
    const products = res.data || [];

    listEl.innerHTML = products.map(p => `
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
              <a href="#"
                 class="btn btn-default add-to-cart"
                 data-id="${p._id}"
                 data-name="${p.name}"
                 data-price="${p.price}"
                 data-image="${p.image || 'images/shop/product1.jpg'}">
                Add to cart
              </a>
            </div>
          </div>
        </div>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    listEl.innerHTML = "<p>Cannot load products</p>";
  }
}

// ================= PRODUCT DETAIL =================
async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  if (!productId) return;

  try {
    const res = await apiFetch(`/products/${productId}`);
    if (!res.success) throw new Error();

    const p = res.data;

    document.getElementById("product-name").innerText = p.name;
    document.getElementById("product-price").innerText =
      p.price.toLocaleString() + " VND";
    document.getElementById("product-brand").innerText = p.brand || "Unknown";
    document.getElementById("product-image").src =
      p.image || "images/shop/product1.jpg";
  } catch {
    alert("Cannot load product");
  }
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
    product: i.product,
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

  if (window.location.pathname.includes("product-details.html")) {
    loadProductDetail();
  }
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
            <a href="#"
               class="btn btn-default add-to-cart"
               data-id="${p._id}"
               data-name="${p.name}"
               data-price="${p.price}"
               data-image="${p.image || 'images/shop/product1.jpg'}">
              Add to cart
            </a>
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
    const res = await apiFetch("/products");
    const products = res.data || [];

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
    const res = await apiFetch("/products");
    const products = res.data || [];

    const recommended = products.slice(0, 12); // 12 sản phẩm

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
