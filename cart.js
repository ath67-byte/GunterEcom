let cartProducts = [];   // product details (name, price, image) for the items in the cart

// ---------- Show the cart ----------
async function loadCart() {
  const cart = getCart();

  // Empty cart: show the message, hide everything else
  if (cart.length === 0) {
    document.getElementById("empty-cart").hidden = false;
    document.getElementById("cart-full").hidden = true;
    return;
  }

  // The cart only stores ids and quantities, so get names, prices and images from Supabase
  const ids = cart.map((c) => c.id);
  const { data, error } = await sb
    .from("products")
    .select("*")
    .in("id", ids);
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
    document.getElementById("empty-cart").hidden = false;
    document.getElementById("cart-full").hidden = true;
    return;
  }

  let total = 0;
  let count = 0;

  const rows = cart.map((item) => {
    const p = cartProducts.find((prod) => prod.id === item.id);
    if (!p) return "";   // product no longer exists, skip it

    const lineTotal = p.price * item.quantity;
    total = total + lineTotal;
    count = count + item.quantity;

    return `
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
  });

  document.getElementById("cart-items").innerHTML = rows.join("");
  document.getElementById("item-count").textContent = "Subtotal (" + count + " items)";
  document.getElementById("cart-total").textContent = "$" + total.toLocaleString();
}

// ---------- Change the cart ----------
function changeQuantity(id, amount) {
  const cart = getCart();
  const item = cart.find((c) => c.id === id);
  if (!item) return;

  item.quantity = item.quantity + amount;

  if (item.quantity <= 0) {
    removeItem(id);
    return;
  }

  saveCart(cart);
  showCart();
}

function removeItem(id) {
  const cart = getCart().filter((c) => c.id !== id);
  saveCart(cart);
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
async function placeOrder(event) {
  event.preventDefault();

  const message = document.getElementById("checkout-message");
  const button = document.getElementById("place-order");
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const user = await getUser();

  // 1. Anonymous visitors: turn their anonymous id into a real account
  if (user.is_anonymous) {
    if (!email || !password) {
      message.textContent = "Please enter an email and a password (at least 6 characters).";
      return;
    }

    button.disabled = true;
    button.textContent = "Placing order...";

    const { error } = await sb.auth.updateUser({
      email: email,
      password: password,
      data: { name: name }
    });
    if (error) {
      message.textContent = error.message;
      button.disabled = false;
      button.textContent = "PLACE ORDER";
      return;
    }
  }

  button.disabled = true;
  button.textContent = "Placing order...";

  // 2. One order row per cart item
  const rows = getCart().map((item) => {
    return {
      customer_name: name,
      product_id: item.id,
      quantity: item.quantity
    };
  });

  const { error } = await sb.from("orders").insert(rows);
  if (error) {
    message.textContent = "Could not place order: " + error.message;
    button.disabled = false;
    button.textContent = "PLACE ORDER";
    return;
  }

  // 3. Done: empty the cart
  saveCart([]);
  document.getElementById("cart-full").hidden = true;
  document.getElementById("empty-cart").hidden = false;
  document.querySelector("#empty-cart p").textContent =
    "Order placed! Gunter has been notified and will start forging soon.";
}

// ---------- Start ----------
document.getElementById("checkout-form").addEventListener("submit", placeOrder);
setUpCheckoutForm();
loadCart();