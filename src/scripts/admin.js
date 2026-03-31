import { getProducts, createProduct } from "../utils/productsApi.js";

const form = document.getElementById("createProductForm");
const tbody = document.getElementById("productsTableBody");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const spots = parseInt(document.getElementById("spots").value, 10);
  const image = document.getElementById("image").value.trim();
  const slug = document.getElementById("slug").value.trim();

  try {
    await createProduct({ name, price, image, slug });
    form.reset();
    loadProducts();
  } catch (err) {
    alert(err.message || "Failed to create event");
  }
});

async function loadProducts() {
  tbody.innerHTML = "<tr><td colspan=\"4\">Loading...</td></tr>";
  try {
    const products = await getProducts();
    if (products.length === 0) {
      tbody.innerHTML = "<tr><td colspan=\"4\">No incoming events.</td></tr>";
      return;
    }
    tbody.innerHTML = products
      .map(
        (p) =>
          `<tr><td>${p.name}</td><td>$${Number(p.price).toFixed(2)}</td><td>${p.stock}</td><td>${p.slug}</td></tr>`
      )
      .join("");
  } catch {
    tbody.innerHTML = "<tr><td colspan=\"4\">Failed to load products.</td></tr>";
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);
