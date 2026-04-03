import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/apiClient";
import { formatCurrency, getImageUrl } from "../../utils/helpers.js";

const imageSlots = [0, 1, 2, 3];

const emptyForm = {
  name: "",
  price: "",
  description: "",
  category: "sling bag",
  stock: "",
  featured: false,
  images: []
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");

  const setImageAtIndex = (index, file) => {
    setForm((prev) => {
      const nextImages = [...prev.images];

      if (file) {
        nextImages[index] = file;
      } else {
        nextImages[index] = null;
      }

      return {
        ...prev,
        images: nextImages
      };
    });
  };

  const loadProducts = async () => {
    const { data } = await api.get("/products");
    setProducts(data);
  };

  useEffect(() => {
    const init = async () => {
      await loadProducts();
    };

    void init();
  }, []);

  const submitProduct = async (event) => {
    event.preventDefault();

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "images") {
        value.filter(Boolean).forEach((file) => payload.append("images", file));
        return;
      }

      if (value !== null && value !== "") payload.append(key, value);
    });

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success("Product updated");
      } else {
        await api.post("/products", payload);
        toast.success("Product added");
      }
      setForm(emptyForm);
      setEditingId("");
      await loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save product");
    }
  };

  const onEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      price: product.price,
      description: product.description,
      category: product.category,
      stock: product.stock,
      featured: product.featured,
      images: []
    });
  };

  return (
    <section className="container section-gap admin-grid">
      <form className="auth-card" onSubmit={submitProduct}>
        <h3>{editingId ? "Edit Product" : "Add Product"}</h3>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
          required
        />
        <textarea
          rows={3}
          placeholder="Description"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          required
        />
        <select
          value={form.category}
          onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
        >
          <option value="sling bag">Sling Bag</option>
          <option value="backpack">Backpack</option>
          <option value="handbag">Handbag</option>
          <option value="duffle bag">Duffle Bag</option>
          <option value="laptop bag">Laptop Bag</option>
        </select>
        <input
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
          required
        />
        <label className="check-row">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))}
          />
          Featured product
        </label>
        <div className="upload-grid">
          {imageSlots.map((slot) => (
            <label key={slot} className="upload-slot">
              <span>Photo {slot + 1}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImageAtIndex(slot, event.target.files?.[0] || null)}
                required={!editingId && slot === 0}
              />
              <small>{form.images?.[slot]?.name || "Choose image"}</small>
            </label>
          ))}
        </div>
        <p className="helper-text">Seller 1 se 4 photos upload kar sakta hai.</p>
        <button className="primary-btn" type="submit">
          {editingId ? "Update" : "Add"}
        </button>
      </form>

      <div>
        <h3>Product Inventory</h3>
        <div className="admin-list">
          {products.map((product) => (
            <article key={product._id} className="admin-item">
              <img src={getImageUrl(product.image)} alt={product.name} />
              <div>
                <p>{product.name}</p>
                <span>{formatCurrency(product.price)}</span>
                <div className="order-meta">
                  <span>{product.images?.length || 1} photos</span>
                </div>
              </div>
              <button className="ghost-btn" onClick={() => onEdit(product)}>
                Edit
              </button>
              <button
                className="text-btn"
                onClick={async () => {
                  await api.delete(`/products/${product._id}`);
                  toast.success("Product removed");
                  await loadProducts();
                }}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdminProductsPage;
