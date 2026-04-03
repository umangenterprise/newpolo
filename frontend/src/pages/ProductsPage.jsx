import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useApp } from "../context/useApp.jsx";
import { formatCurrency } from "../utils/helpers.js";

const categories = ["all", "sling bag", "backpack", "handbag"];
const PRODUCTS_PER_PAGE = 6;
const previewProducts = [
  {
    _id: "preview-urban-drift",
    name: "Urban Drift Sling",
    price: 1299,
    category: "sling bag",
    averageRating: 4.6,
    numReviews: 18,
    image:
      "https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=900&q=80",
    description: "Compact everyday sling with a clean city-ready look."
  },
  {
    _id: "preview-metro-flex",
    name: "Metro Flex Backpack",
    price: 2499,
    category: "backpack",
    averageRating: 4.8,
    numReviews: 26,
    image:
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=80",
    description: "Laptop-friendly backpack with a sharp commuter silhouette."
  },
  {
    _id: "preview-luna-arc",
    name: "Luna Arc Handbag",
    price: 2199,
    category: "handbag",
    averageRating: 4.7,
    numReviews: 14,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
    description: "Structured handbag styled as a premium catalog preview."
  }
];

const ProductsPage = () => {
  const { products, fetchProducts } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const selectedCategory = searchParams.get("category") || "all";
  const q = searchParams.get("q") || "";
  const min = searchParams.get("min") || "";
  const max = searchParams.get("max") || "";
  const currentPage = Math.max(Number(searchParams.get("page") || "1"), 1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchProducts({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        q: q || undefined,
        minPrice: min || undefined,
        maxPrice: max || undefined
      });
      setLoading(false);
    };

    load();
  }, [fetchProducts, selectedCategory, q, min, max]);

  const filtersText = useMemo(() => {
    if (!q && selectedCategory === "all" && !min && !max) return "All products";
    return "Filtered results";
  }, [selectedCategory, q, min, max]);

  const totalPages = Math.max(Math.ceil(products.length / PRODUCTS_PER_PAGE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PRODUCTS_PER_PAGE;
    return products.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [products, safeCurrentPage]);

  useEffect(() => {
    if (currentPage === safeCurrentPage) return;

    const next = new URLSearchParams(searchParams);
    if (safeCurrentPage <= 1) next.delete("page");
    else next.set("page", String(safeCurrentPage));
    setSearchParams(next, { replace: true });
  }, [currentPage, safeCurrentPage, searchParams, setSearchParams]);

  const updateParams = (updater) => {
    const next = new URLSearchParams(searchParams);
    updater(next);
    next.delete("page");
    setSearchParams(next);
  };

  const goToPage = (page) => {
    const next = new URLSearchParams(searchParams);
    if (page <= 1) next.delete("page");
    else next.set("page", String(page));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="container section-gap">
      <div className="section-head">
        <h2>Shop Bags</h2>
        <p>{filtersText}</p>
      </div>

      <div className="filters-row">
        {categories.map((category) => (
          <button
            key={category}
            className={selectedCategory === category ? "chip active" : "chip"}
            onClick={() => {
              updateParams((next) => {
                if (category === "all") next.delete("category");
                else next.set("category", category);
              });
            }}
          >
            {category}
          </button>
        ))}

        <input
          className="price-input"
          placeholder="Min price"
          value={min}
          onChange={(event) => {
            updateParams((next) => {
              if (event.target.value) next.set("min", event.target.value);
              else next.delete("min");
            });
          }}
        />
        <input
          className="price-input"
          placeholder="Max price"
          value={max}
          onChange={(event) => {
            updateParams((next) => {
              if (event.target.value) next.set("max", event.target.value);
              else next.delete("max");
            });
          }}
        />
      </div>

      {loading ? (
        <Loader text="Loading products..." />
      ) : products.length === 0 ? (
        <div className="empty-products-state">
          <div className="empty-state">
            <h3>No bags found yet</h3>
            <p>
              Products abhi list me nahi aaye. Backend me sample products seed karne ke baad yahan
              real photo cards dikhne lagenge.
            </p>
            <div className="empty-actions">
              <Link to="/" className="primary-btn">
                Back to Home
              </Link>
              <span className="helper-text">Preview cards neeche dikh rahe hain.</span>
            </div>
            <div className="products-grid preview-grid">
              {previewProducts.map((item) => (
                <article key={item._id} className="product-card preview-card">
                  <div className="image-link preview-image">
                    <img src={item.image} alt={item.name} />
                    <span className="preview-badge">Preview</span>
                  </div>
                  <div className="product-body">
                    <div className="product-meta">
                      <span className="product-category">{item.category}</span>
                      <span className="stock-badge in-stock">Sample card</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <p className="helper-text">
                      Rating {item.averageRating.toFixed(1)} / 5 ({item.numReviews})
                    </p>
                    <div className="product-bottom">
                      <div>
                        <strong>{formatCurrency(item.price)}</strong>
                        <span className="price-caption">Seed hone ke baad yahan real product aayega</span>
                      </div>
                      <div className="product-actions">
                        <button type="button" className="ghost-btn" disabled>
                          View
                        </button>
                        <button type="button" disabled>
                          Add to cart
                        </button>
                      </div>
                    </div>
                    <p className="preview-note">Real add to cart, rating aur payment backend products aane par kaam karega.</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="catalog-meta">
            <p>
              Showing {(safeCurrentPage - 1) * PRODUCTS_PER_PAGE + 1}-
              {Math.min(safeCurrentPage * PRODUCTS_PER_PAGE, products.length)} of {products.length}
            </p>
            <span>
              Page {safeCurrentPage} of {totalPages}
            </span>
          </div>

          <div className="products-grid">
            {paginatedProducts.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-row">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => goToPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
              >
                Previous
              </button>

              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      type="button"
                      className={page === safeCurrentPage ? "chip active" : "chip"}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="ghost-btn"
                onClick={() => goToPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ProductsPage;
