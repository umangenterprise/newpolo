import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { formatCurrency, getImageUrl } from "../utils/helpers.js";

const ProductCard = ({ product }) => {
  const { addToCart, user } = useApp();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const shortDescription =
    product.description?.length > 84 ? `${product.description.slice(0, 84)}...` : product.description;
  const images = product.images?.length ? product.images : [product.image];

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product._id]);

  useEffect(() => {
    if (!isSliding || images.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [images.length, isSliding]);

  const goToNextImage = () => {
    if (images.length < 2) return;
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <motion.article className="product-card" whileHover={{ y: -6 }}>
      <Link
        to={`/products/${product._id}`}
        className="image-link"
        onMouseEnter={() => setIsSliding(true)}
        onMouseLeave={() => setIsSliding(false)}
        onTouchStart={() => setIsSliding(true)}
        onTouchEnd={() => {
          setIsSliding(false);
          goToNextImage();
        }}
      >
        <img src={getImageUrl(images[activeImageIndex])} alt={product.name} />
        {images.length > 1 && (
          <div className="card-dots">
            {images.map((image, index) => (
              <span key={image} className={index === activeImageIndex ? "card-dot active-dot" : "card-dot"} />
            ))}
          </div>
        )}
      </Link>
      <div className="product-body">
        <div className="product-meta">
          <span className="product-category">{product.category}</span>
          <span className={product.stock > 0 ? "stock-badge in-stock" : "stock-badge out-stock"}>
            {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
          </span>
        </div>
        <h3>{product.name}</h3>
        <p>{shortDescription}</p>
        <p className="helper-text">
          Rating {(product.averageRating || 0).toFixed(1)} / 5 ({product.numReviews || 0})
        </p>
        <div className="product-bottom">
          <div>
            <strong>{formatCurrency(product.price)}</strong>
            <span className="price-caption">Free shipping over INR 1999</span>
          </div>
          <div className="product-actions">
            <Link to={`/products/${product._id}`} className="ghost-btn product-link">
              View
            </Link>
            <button onClick={() => user && addToCart(product._id)} disabled={!user || product.stock < 1}>
              {product.stock < 1 ? "Out of stock" : user ? "Add to cart" : "Login to buy"}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
