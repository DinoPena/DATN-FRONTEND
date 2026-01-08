// ================= CART UTILS =================
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const el = document.getElementById("cart-count");
  if (el) el.innerText = count;
}

// expose global
window.getCart = getCart;
window.saveCart = saveCart;
window.updateCartCount = updateCartCount;
