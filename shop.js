
let allProducts = [];   

async function loadLine() {
  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("line", LINE);
  if (error) {
    console.error(error);
    return;
  }

  allProducts = data;
  updateProducts();
}

function updateProducts() {
  const filtered = filterProducts(allProducts);
  const sorted = sortProducts(filtered);
  showProducts(sorted);
}

function showProducts(list) {
  const box = document.getElementById("product-list");

  if (list.length === 0) {
    box.innerHTML = "<p>No products match these filters.</p>";
    return;
  }

  box.innerHTML = list.map((p) => {
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


function getChecked(groupId) {
  const boxes = document.querySelectorAll(`#${groupId} input:checked`);
  const values = [];
  boxes.forEach((box) => {
    values.push(box.value);
  });
  return values;
}

function filterProducts(list) {
  const types = getChecked("type-of-item");
  const materials = getChecked("material-filter");
  const prices = getChecked("price-filter");
  const availability = getChecked("availabilty");

  return list.filter((p) => {
    if (types.length > 0 && !types.includes(p.type)) {
      return false;
    }
    if (materials.length > 0 && !materials.includes(p.material)) {
      return false;
    }
    if (prices.length > 0) {
      const inRange = prices.some((range) => {
        // "1000+" means 1000 and up
        if (range.endsWith("+")) {
          return p.price >= Number(range.replace("+", ""));
        }
        const parts = range.split("-");
        const min = Number(parts[0]);
        const max = Number(parts[1]);
        return p.price >= min && p.price < max;
      });
      if (!inRange) {
        return false;
      }
    }
    if (availability.length > 0) {
      let stock = "out-of-stock";
      if (p.in_stock) {
        stock = "in-stock";
      }
      if (!availability.includes(stock)) {
        return false;
      }
    }
    return true;
  });
}

// ---------- Sort ----------
function sortProducts(list) {
  const sortBy = document.getElementById("sort-by").value;
  const sorted = [...list];   // copy, so allProducts keeps its original order

  if (sortBy === "AZ") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sortBy === "ZA") {
    sorted.sort((a, b) => b.name.localeCompare(a.name));
  }
  if (sortBy === "price-low") {
    sorted.sort((a, b) => a.price - b.price);
  }
  if (sortBy === "price-high") {
    sorted.sort((a, b) => b.price - a.price);
  }
  // "Trending" = leave the original order

  return sorted;
}

// ---------- Product page (product.html?id=...) ----------
function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadProduct() {
  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("id", getProductId())
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

// ---------- Start: run only what this page needs ----------
getUser();

if (document.getElementById("product-list")) {
  loadLine();
}
if (document.querySelector(".filternav")) {
  document.querySelector(".filternav").addEventListener("change", updateProducts);
}
if (document.getElementById("sort-by")) {
  document.getElementById("sort-by").addEventListener("change", updateProducts);
}
if (document.getElementById("product-name")) {
  loadProduct();
}
if (document.getElementById("add-to-cart")) {
  document.getElementById("add-to-cart").addEventListener("click", addToCart);
}
