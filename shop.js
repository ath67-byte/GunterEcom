
let allProducts = [];   

async function loadLine() { // loads all the product line
  const {data, error} = await sb
    .from("products")
    .select("*")
    .eq("line", LINE); //only keeps lines in LINE
  if (error) {
    console.error(error);
    return;
  }

  allProducts = data; //saves the product in a list
  updateProducts();
}

function updateProducts() { // updates the products based on what was checked
  const filtered = filterProducts(allProducts);
  const sorted = sortProducts(filtered);
  showProducts(sorted);
}

function showProducts(list) { // draws what each product looks like on the page
  const box = document.getElementById("product-list");

  if (list.length === 0) {
    box.innerHTML = "<p>No products match these filters.</p>";
    return; // if there are no products that are in the list
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


function getChecked(groupId) { // reads the boxes that are checkeed
  const boxes = document.querySelectorAll(`#${groupId} input:checked`);
  const values = [];
  boxes.forEach((box) => {
    values.push(box.value);
  });
  return values;
}

function filterProducts(list) { // keep only ones that match the filter checked
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


function sortProducts(list) { // sorts the products
  const sortBy = document.getElementById("sort-by").value;
  const sorted = [...list]; 

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


  return sorted;
}


function getProductId() { //finds the product id
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadProduct() { // loads the individual product page
  const { data, error } = await sb
    .from("products")
    .select("*")
    .eq("id", getProductId())
    .single();
  if (error) {
    document.getElementById("product-name").textContent = "Product not found";
    return;
  }

  let price = "Price coming soon"; // shown when the product has no price yet
  if (data.price !== null) {
    price = "$" + data.price;
  }

  document.getElementById("product-image").src = data.image_url;
  document.getElementById("product-name").textContent = data.name;
  document.getElementById("product-price").textContent = price;
  document.getElementById("product-description").textContent = data.description ?? "";
}

function addToCart() { // adds the items to the cart
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


getUser(); // makes sure the user is signed in and if not assigns a id so orders can be tied back to them

if (document.getElementById("product-list")) { // loads the lines
  loadLine();
}
if (document.querySelector(".filternav")) { // listens for change in filter and updates the list
  document.querySelector(".filternav").addEventListener("change", updateProducts);
}
if (document.getElementById("sort-by")) { // listens for change in sort and updates the list
  document.getElementById("sort-by").addEventListener("change", updateProducts);
}
if (document.getElementById("product-name")) { // loads the product
  loadProduct();
}
if (document.getElementById("add-to-cart")) { // listens for add to cart
  document.getElementById("add-to-cart").addEventListener("click", addToCart);
}
