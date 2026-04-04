import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/useApp.jsx";
import { formatCurrency, getImageUrl, getProductGstPercent } from "../utils/helpers.js";

void motion;

const ProductCard = ({ product }) => {
  const { addToCart, user } = useApp();
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const shortDescription =
    product.description?.length > 84 ? `${product.description.slice(0, 84)}...` : product.description;
  const images = product.images?.length ? product.images : [product.image];
  const gstPercent = getProductGstPercent(product);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveImageIndex(0);
    }, 0);

    return () => window.clearTimeout(timer);
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

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login first");
      navigate("/auth");
      return;
    }

    await addToCart(product._id);
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
            <span className="price-caption">GST {gstPercent}% extra</span>
            <span className="price-caption">Free shipping over INR 1999</span>
          </div>
          <div className="product-actions">
            <Link to={`/products/${product._id}`} className="ghost-btn product-link">
              View
            </Link>
            <button onClick={handleAddToCart} disabled={product.stock < 1}>
              {product.stock < 1 ? "Out of stock" : user ? "Add to cart" : "Login to buy"}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
