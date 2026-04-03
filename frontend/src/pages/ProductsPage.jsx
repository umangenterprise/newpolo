import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Loader from "../components/Loader.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useApp } from "../context/AppContext.jsx";

const categories = ["all", "sling bag", "backpack", "handbag"];
const PRODUCTS_PER_PAGE = 6;

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
  }, [selectedCategory, q, min, max]);

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
        <div className="empty-state">
          <h3>No bags found yet</h3>
          <p>
            Products abhi list me nahi aaye. Backend me sample products seed karne ke baad yahan
            photo cards dikhne lagenge.
          </p>
          <Link to="/" className="primary-btn">
            Back to Home
          </Link>
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
