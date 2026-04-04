import { Link } from "react-router-dom";
import { useApp } from "../context/useApp.jsx";
import { calculateCartTotals, formatCurrency, getImageUrl, getProductGstPercent } from "../utils/helpers.js";

const CartPage = () => {
  const { cart, removeCartItem, updateCartQty } = useApp();
  const { subtotal, gstAmount, shippingFee, totalAmount } = calculateCartTotals(cart.items);

  if (!cart.items?.length) {
    return (
      <section className="container section-gap">
        <h2>Your cart is empty</h2>
        <Link to="/products" className="primary-btn">
          Start shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="container section-gap cart-grid">
      <div>
        {cart.items.map((item) => (
          <article key={item.product._id} className="cart-item">
            <img src={getImageUrl(item.product.image)} alt={item.product.name} />
            <div>
              <h4>{item.product.name}</h4>
              <p>{formatCurrency(item.product.price)}</p>
              <p className="helper-text">GST: {getProductGstPercent(item.product)}%</p>
              <div className="qty-row">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateCartQty(item.product._id, Number(event.target.value))}
                />
                <button onClick={() => removeCartItem(item.product._id)}>Remove</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <aside className="summary-card">
        <h3>Order Summary</h3>
        <p>Subtotal: {formatCurrency(subtotal)}</p>
        <p>GST: {formatCurrency(gstAmount)}</p>
        <p>Shipping: {shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}</p>
        <strong>Total: {formatCurrency(totalAmount)}</strong>
        <Link to="/checkout" className="primary-btn">
          Add Delivery Address
        </Link>
      </aside>
    </section>
  );
};

export default CartPage;
