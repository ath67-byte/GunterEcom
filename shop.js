async function loadLine() {
  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("line", LINE);
  if (error) {
    console.error(error);
    return;
  }

  const list = document.getElementById("product-list");
  list.innerHTML = data.map((p) => {
    const link = "product.html?id=" + p.id;

    return `
      <a href="${link}">
        <figure>
          <img src="${p.image_url}">
          <figcaption>${p.name}</figcaption>
        </figure>
      </a>
    `;
  }).join("");
}


function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadProduct() {
  const { data, error } = await sb
    .from("products")
    .select("*")
    .single();
  if (error) {
    document.getElementById("product-name").textContent = "Product not found";
    return;
  }

  let price = "Price coming soon";
  if (data.price !== null) {
    price = "$" + data.price;
  }

  document.getElementById("product-image").src = data.image_url;
  document.getElementById("product-name").textContent = data.name;
  document.getElementById("product-price").textContent = price;
  document.getElementById("product-description").textContent = data.description ?? "";
}


function addToCart() {
  const id = getProductId();
  const cart = getCart();

  const item = cart.find((c) => c.id === id);
  if (item) {
    item.quantity = item.quantity + 1;
  } else {
    cart.push({ id: id, quantity: 1 });
  }

  saveCart(cart);
  document.getElementById("cart-message").textContent = "Added to cart!";
}

getUser();

if (document.getElementById("product-list")) {
  loadLine();
}
if (document.getElementById("product-name")) {
  loadProduct();
}
if (document.getElementById("add-to-cart")) {
  document.getElementById("add-to-cart").addEventListener("click", addToCart);
}

const priceSort = document.getElementById("price-high");
priceSort.addEventListener("click", async () => {

});