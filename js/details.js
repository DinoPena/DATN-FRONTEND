// ================== CONFIG ==================
const API_URL = "http://localhost:3000/api/products";

let currentProduct = null;

// ================== CART UTILS ==================
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ================== URL ==================
function getProductIdFromUrl() {
  return new URLSearchParams(window.location.search).get("id");
}

// ================== LOAD PRODUCT ==================
async function loadProductDetail() {
  const productId = getProductIdFromUrl();
  if (!productId) return alert("Product not found");

  try {
    const res = await fetch(`${API_URL}/${productId}`);
    const result = await res.json();

    const product = result.data || result.product || result;

    if (!product || !res.ok) {
      alert("Cannot load product");
      return;
    }

    currentProduct = product;
    renderProduct(product);

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}


// ================== RENDER ==================
function renderProduct(product) {
  document.getElementById("product-image").src =
    product.image || "images/shop/product1.jpg";

  document.getElementById("product-name").innerText = product.name;
  document.getElementById("product-price").innerText =
    product.price.toLocaleString("vi-VN") + " VND";

  document.getElementById("product-brand").innerText =
    product.brand || "Unknown";

  document.getElementById("product-category").innerText =
    `${product.category || ""} ${product.subCategory || ""}`;

  document.getElementById("product-description").innerText =
    product.description || "";

  document.getElementById("product-stock").innerText =
    product.stock > 0 ? "In stock" : "Out of stock";

  document.getElementById("product-condition").innerText = "New";

  const qtyInput = document.getElementById("product-qty");
  qtyInput.max = product.stock;
  qtyInput.disabled = product.stock === 0;
}

// ================== ADD TO CART ==================
function addToCartFromDetail() {
  if (!currentProduct) return;

  const qty = Number(document.getElementById("product-qty").value);

  if (qty < 1) {
    alert("Invalid quantity");
    return;
  }

  if (qty > currentProduct.stock) {
    alert("Quantity exceeds stock");
    return;
  }

  let cart = getCart();
  const item = cart.find(p => p.productId === currentProduct._id);

  if (item) {
    item.quantity += qty;
  } else {
    cart.push({
      productId: currentProduct._id,
      name: currentProduct.name,
      price: currentProduct.price,
      image: currentProduct.image,
      stock: currentProduct.stock,
      quantity: qty
    });
  }

  saveCart(cart);
  alert("Added to cart successfully");
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", loadProductDetail);

// ⚠️ BẮT BUỘC: expose function cho HTML onclick
window.addToCartFromDetail = addToCartFromDetail;
