document.addEventListener("DOMContentLoaded", renderCart);

// ================= RENDER CART =================
function renderCart() {
  const tbody = document.getElementById("cart-body");
  if (!tbody) return;
  const cart = getCart();

  if (!cart.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center">
          Cart is empty
        </td>
      </tr>
    `;
    updateTotal();
    return;
  }

  tbody.innerHTML = cart.map(renderCartRow).join("");
  updateTotal();
}

// ================= RENDER ROW =================
function renderCartRow(item) {
  return `
    <tr>
      <td class="cart_product">
        <img src="${item.image}" width="80">
      </td>

      <td class="cart_description">
        <h4>${item.name}</h4>
        <p>ID: ${item.productId}</p>
      </td>

      <td class="cart_price">
        <p>
            ${(item.price ?? 0).toLocaleString()} VND
        </p>
      </td>

      <td class="cart_quantity">
        <input type="number"
            min="1"
            max="${item.stock}"
            value="${item.quantity}"
            onchange="updateQty('${item.productId}', this.value)">
      </td>

      <td class="cart_total">
        <p class="cart_total_price">
            ${((item.price ?? 0) * (item.quantity ?? 0)).toLocaleString()} VND
        </p>
      </td>

      <td class="cart_delete">
        <a href="#" onclick="removeItem('${item.productId}')">
          <i class="fa fa-times"></i>
        </a>
      </td>
    </tr>
  `;
}

// ================= UPDATE QTY =================
function updateQty(productId, qty) {
  qty = Number(qty);
  if (qty < 1) return;

  let cart = getCart();
  const item = cart.find(p => p.productId === productId);

  if (!item) return;

  if (qty > item.stock) {
    alert(`Only ${item.stock} items in stock`);
    return;
  }

  item.quantity = qty;
  saveCart(cart);
  updateCartCount();
  renderCart();
}


// ================= REMOVE ITEM =================
function removeItem(productId) {
  let cart = getCart().filter(p => p.productId !== productId);
  saveCart(cart);
  updateCartCount();
  renderCart();
}

// ================= TOTAL =================
function updateTotal() {
  const cart = getCart();
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  document.getElementById("cart-subtotal").innerText =
    total.toLocaleString() + " VND";

  document.getElementById("cart-total").innerText =
    total.toLocaleString() + " VND";
}

// ================= CHECKOUT =================
async function checkout() {
  const cart = getCart();

  if (!cart.length) {
    alert("Cart is empty");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  const items = cart.map(i => ({
    product: i.productId,
    quantity: i.quantity,
    price: i.price
  }));

  const res = await fetch("http://localhost:3000/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ items })
  });
  if (res.status === 403) {
  alert("Tài khoản đã bị khóa");
  localStorage.clear();
  window.location.href = "login.html";
  return;
}

  console.log("TOKEN:", token);
  const data = await res.json();

  if (!data.success) {
    alert(data.message || "Checkout failed");
    return;
  }

  alert("Order created successfully");
  localStorage.removeItem("cart");
  updateCartCount();
  renderCart();
}

window.updateQty = updateQty;
window.removeItem = removeItem;
window.checkout = checkout;
