let cartProducts = [];   // product details (name, price, image) for the items in the cart

// ---------- Helpers ----------
function showEmptyCart() {
  document.getElementById("empty-cart").hidden = false;
  document.getElementById("cart-full").hidden = true;
}

// Returns the thing in the list with this id, or null if there isn't one
function findById(list, id) {
  for (const thing of list) {
    if (thing.id === id) {
      return thing;
    }
  }
  return null;
}

// ---------- Show the cart ----------
async function loadCart() {
  const cart = getCart();
  if (cart.length === 0) {
    showEmptyCart();
    return;
  }

  // The cart only stores ids and quantities, so get names, prices and images from Supabase
  const ids = [];
  for (const item of cart) {
    ids.push(item.id);
  }

  const { data, error } = await sb.from("products").select("*").in("id", ids);
  if (error) {
    console.error(error);
    return;
  }

  cartProducts = data;
  showCart();
}

function showCart() {
  const cart = getCart();
  if (cart.length === 0) {
    showEmptyCart();
    return;
  }

  let html = "";
  let total = 0;
  let count = 0;

  for (const item of cart) {
    const p = findById(cartProducts, item.id);

    // Skip products that no longer exist
    if (p !== null) {
      const lineTotal = p.price * item.quantity;
      total = total + lineTotal;
      count = count + item.quantity;

      html += `
        <div class="cartItem">
          <img src="${p.image_url}">
          <div class="cartItemInfo">
            <p><strong>${p.name}</strong></p>
            <p>${p.line} Line</p>
            <p>$${p.price.toLocaleString()}</p>
            <div class="qty">
              <button type="button" onclick="changeQuantity('${p.id}', -1)">−</button>
              <span>${item.quantity}</span>
              <button type="button" onclick="changeQuantity('${p.id}', 1)">+</button>
            </div>
            <button type="button" class="removeBtn" onclick="removeItem('${p.id}')">Remove</button>
          </div>
          <p class="lineTotal">$${lineTotal.toLocaleString()}</p>
        </div>
      `;
    }
  }

  document.getElementById("cart-items").innerHTML = html;
  document.getElementById("item-count").textContent = "Subtotal (" + count + " items)";
  document.getElementById("cart-total").textContent = "$" + total.toLocaleString();
}

// ---------- Change the cart ----------
// amount is 1 for the + button and -1 for the − button
function changeQuantity(id, amount) {
  const cart = getCart();
  const item = findById(cart, id);
  if (item === null) {
    return;
  }

  item.quantity = item.quantity + amount;
  if (item.quantity <= 0) {
    removeItem(id);
    return;
  }

  saveCart(cart);
  showCart();
}

function removeItem(id) {
  const newCart = [];
  for (const item of getCart()) {
    if (item.id !== id) {
      newCart.push(item);
    }
  }
  saveCart(newCart);
  showCart();
}

// ---------- Logged-in customers don't need email/password again ----------
async function setUpCheckoutForm() {
  const user = await getUser();
  if (!user.is_anonymous) {
    document.getElementById("account-fields").hidden = true;
  }
}

// ---------- Place the order ----------
// Shows a message and turns the button back on so the customer can try again
function showCheckoutError(text) {
  const button = document.getElementById("place-order");
  button.disabled = false;
  button.textContent = "PLACE ORDER";
  document.getElementById("checkout-message").textContent = text;
}

async function placeOrder(event) {
  event.preventDefault();   // stop the form from reloading the page

  const button = document.getElementById("place-order");
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const user = await getUser();

  if (user.is_anonymous && (!email || !password)) {
    showCheckoutError("Please enter an email and a password (at least 6 characters).");
    return;
  }

  button.disabled = true;
  button.textContent = "Placing order...";

  // 1. Anonymous visitors: turn their anonymous id into a real account
  if (user.is_anonymous) {
    const { error } = await sb.auth.updateUser({
      email: email,
      password: password,
      data: { name: name }
    });
    if (error) {
      showCheckoutError(error.message);
      return;
    }
  }

  // 2. One order row per cart item
  const rows = [];
  for (const item of getCart()) {
    rows.push({
      customer_name: name,
      product_id: item.id,
      quantity: item.quantity
    });
  }

  const { error } = await sb.from("orders").insert(rows);
  if (error) {
    showCheckoutError("Could not place order: " + error.message);
    return;
  }

  // 3. Done: empty the cart
  saveCart([]);
  showEmptyCart();
  document.querySelector("#empty-cart p").textContent =
    "Order placed! Gunter has been notified and will start forging soon.";

  // Point the link under the message to the customer's orders
  const link = document.querySelector("#empty-cart a");
  link.href = "orders.html";
  link.textContent = "Check your order status";
}

// ---------- Start ----------
document.getElementById("checkout-form").addEventListener("submit", placeOrder);
setUpCheckoutForm();
loadCart();
