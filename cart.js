let cartProducts = [];

function showEmptyCart() { //shows info for empty cart
  document.getElementById("empty-cart").hidden = false;
  document.getElementById("cart-full").hidden = true;
}


function findById(list, id) { //finds id of item
  for (const thing of list) {
    if (thing.id === id) {
      return thing;
    }
  }
  return null;
}


async function loadCart() { //loads the cart

  const ids = [];
  for (const item of getCart()) {
    ids.push(item.id);
  }

  const {data, error} = await sb.from("products").select("*").in("id", ids);
  if (error) {
    console.error(error);
    return;
  }

  cartProducts = data;
  showCart();
}

function showCart() { //draws the cart
  const cart = getCart();
  if (cart.length === 0) {
    showEmptyCart(); //if cart is empty then goes back to showEmptyCart
    return;
  }

  let html = "";
  let total = 0;
  let count = 0;

  for (const item of cart) {
    const p = findById(cartProducts, item.id);

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
      `; //draws html
    }
  }

  document.getElementById("cart-items").innerHTML = html;
  document.getElementById("item-count").textContent = "Subtotal (" + count + " items)";
  document.getElementById("cart-total").textContent = "$" + total.toLocaleString();
}


function changeQuantity(id, amount) { //for the change quantity button
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

function removeItem(id) { // for the remove item
  const newCart = [];
  for (const item of getCart()) {
    if (item.id !== id) {
      newCart.push(item);
    }
  }
  saveCart(newCart);
  showCart();
}

async function placeOrder(event) { // place order button
  event.preventDefault();   // stop the form from reloading the page

  const button = document.getElementById("place-order");
  const name = document.getElementById("name").value.trim();
  const notes = document.getElementById("notes").value.trim();

  button.disabled = true;
  button.textContent = "Placing order...";

  await getUser();

  const rows = [];
  for (const item of getCart()) {
    rows.push({
      customer_name: name,
      product_id: item.id,
      quantity: item.quantity,
      notes: notes
    });
  }

  const { error } = await sb.from("orders").insert(rows);
  if (error) {

    button.disabled = false;
    button.textContent = "PLACE ORDER";
    document.getElementById("checkout-message").textContent = "Could not place order: " + error.message;
    return;
  }


  saveCart([]);
  showEmptyCart();
  document.querySelector("#empty-cart p").textContent =
    "Order placed! Gunter has been notified and will start forging soon.";
}

// when the form is filled out, runs place order
document.getElementById("checkout-form").addEventListener("submit", placeOrder);
loadCart(); // loads the cart when the page is opened
