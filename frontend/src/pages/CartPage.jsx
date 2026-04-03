import { Link } from "react-router-dom";
import { useApp } from "../context/useApp.jsx";
import { formatCurrency, getImageUrl } from "../utils/helpers.js";

const CartPage = () => {
  const { cart, removeCartItem, updateCartQty } = useApp();
  const subtotal = cart.items?.reduce((sum, item) => sum + item.product.price * item.quantity, 0) || 0;

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
        <p>Shipping: {subtotal > 1999 ? "Free" : formatCurrency(99)}</p>
        <strong>Total: {formatCurrency(subtotal > 1999 ? subtotal : subtotal + 99)}</strong>
        <Link to="/checkout" className="primary-btn">
          Add Delivery Address
        </Link>
      </aside>
    </section>
  );
};

export default CartPage;
