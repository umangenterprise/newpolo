import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiX } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import Loader from "../components/Loader.jsx";
import { useApp } from "../context/useApp.jsx";
import { formatCurrency, getImageUrl, getProductGstPercent } from "../utils/helpers.js";

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, user } = useApp();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        setSelectedImage(data.images?.[0] || data.image);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load product");
      }
    };

    load();
  }, [id]);

  if (!product)
    return (
      <div className="container section-gap">
        <Loader text="Loading product..." />
      </div>
    );

  return (
    <>
      <section className="container section-gap details-grid">
        <div>
          <button
            type="button"
            className="details-image-btn"
            onClick={() => setIsImageZoomed(true)}
            aria-label="Open larger product image"
          >
            <img src={getImageUrl(selectedImage || product.image)} alt={product.name} className="details-image" />
          </button>
          <p className="helper-text">Photo par tap/click karo aur bada dekh lo.</p>
        {!!product.images?.length && (
          <div className="thumb-grid">
            {product.images.map((image) => (
              <button
                key={image}
                type="button"
                className={selectedImage === image ? "thumb-btn active-thumb" : "thumb-btn"}
                onClick={() => setSelectedImage(image)}
              >
                <img src={getImageUrl(image)} alt={product.name} />
              </button>
            ))}
          </div>
        )}
        </div>
        <div>
          {(() => {
            const gstPercent = getProductGstPercent(product);
            const gstAmount = (Number(product.price) || 0) * (gstPercent / 100);
            const finalPrice = (Number(product.price) || 0) + gstAmount;
            return (
              <>
          <span className="product-category">{product.category}</span>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <h3>{formatCurrency(product.price)}</h3>
          <p className="helper-text">
            GST {gstPercent}% ({formatCurrency(gstAmount)}) • Final price {formatCurrency(finalPrice)}
          </p>
          <p>
            Rating: {(product.averageRating || 0).toFixed(1)} / 5 ({product.numReviews || 0} reviews)
          </p>
          <p>Stock: {product.stock}</p>
              </>
            );
          })()}

          <div className="details-actions">
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
            <button
              className="primary-btn"
              onClick={async () => {
                if (!user) {
                  toast.error("Please login first");
                  navigate("/auth");
                  return;
                }
                await addToCart(product._id, quantity);
              }}
              disabled={product.stock < 1}
            >
              Add to Cart
            </button>
          </div>

          <div className="review-box">
            <h3>Rate This Product</h3>
            <p className="helper-text">
              Delivered order ke baad hi rating submit hogi. Same account se aap review update bhi kar sakte ho.
            </p>
            <div className="details-actions">
              <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Very good</option>
                <option value={3}>3 - Good</option>
                <option value={2}>2 - Average</option>
                <option value={1}>1 - Poor</option>
              </select>
            </div>
            <textarea
              rows={3}
              placeholder="Write your review (optional)"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <button
              className="primary-btn"
              disabled={!user || submittingReview}
              onClick={async () => {
                if (!user) {
                  toast.error("Please login first");
                  navigate("/auth");
                  return;
                }

                try {
                  setSubmittingReview(true);
                  const { data } = await api.post(`/products/${product._id}/reviews`, {
                    rating,
                    comment
                  });
                  setProduct(data.product);
                  toast.success(data.message || "Review submitted");
                } catch (error) {
                  toast.error(error.response?.data?.message || "Failed to submit review");
                } finally {
                  setSubmittingReview(false);
                }
              }}
            >
              {submittingReview ? "Submitting..." : "Submit Rating"}
            </button>
          </div>

          <div className="review-list">
            <h3>Customer Reviews</h3>
            {!product.reviews?.length ? (
              <p className="helper-text">No reviews yet.</p>
            ) : (
              product.reviews
                .slice()
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map((review) => (
                  <article key={review._id} className="review-item">
                    <p>
                      <strong>{review.name}</strong> - {review.rating}/5
                    </p>
                    <p className="helper-text">
                      {new Date(review.updatedAt || review.createdAt).toLocaleDateString()}
                    </p>
                    <p>{review.comment || "No comment"}</p>
                  </article>
                ))
            )}
          </div>
        </div>
      </section>

      {isImageZoomed && (
        <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setIsImageZoomed(false)}>
          <button
            type="button"
            className="lightbox-close"
            aria-label="Close image preview"
            onClick={() => setIsImageZoomed(false)}
          >
            <FiX />
          </button>
          <img
            src={getImageUrl(selectedImage || product.image)}
            alt={product.name}
            className="lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ProductDetailsPage;
