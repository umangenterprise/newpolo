import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../api/apiClient";
import { useApp } from "../context/AppContext.jsx";
import { formatCurrency, getImageUrl, parseShippingAddress } from "../utils/helpers.js";

const emptyAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: ""
};

const ProfilePage = () => {
  const { user, fetchMe } = useApp();
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", ...emptyAddress });
  const visibleOrders = orders.filter((order) => order.orderStatus !== "cancelled");

  const loadOrders = async () => {
    const { data } = await api.get("/orders/my");
    setOrders(data);
  };

  useEffect(() => {
    if (user) {
      const addressParts = parseShippingAddress(user.address);
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        line1: addressParts.line1,
        line2: addressParts.line2,
        city: addressParts.city,
        state: addressParts.state,
        pincode: addressParts.pincode
      });
    }
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, []);

  const cancelOrder = async (orderId) => {
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      toast.success("Order cancelled");
    } catch (error) {
      toast.error(error.response?.data?.message || "Cancel failed");
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    try {
      const address = [
        form.name,
        form.phone,
        form.line1,
        form.line2,
        form.city,
        form.state,
        form.pincode
      ]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join(", ");

      await api.put("/auth/me", {
        name: form.name,
        phone: form.phone,
        address
      });
      await fetchMe();
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  return (
    <section className="container section-gap profile-grid">
      <form className="auth-card" onSubmit={saveProfile}>
        <h2>My Profile</h2>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Name"
        />
        <input
          type="text"
          value={form.phone}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, phone: event.target.value.replace(/\D/g, "").slice(0, 10) }))
          }
          placeholder="Phone"
        />
        <input
          type="text"
          value={form.line1}
          onChange={(event) => setForm((prev) => ({ ...prev, line1: event.target.value }))}
          placeholder="House no / Flat / Street"
        />
        <input
          type="text"
          value={form.line2}
          onChange={(event) => setForm((prev) => ({ ...prev, line2: event.target.value }))}
          placeholder="Area / Landmark"
        />
        <div className="two-col-grid">
          <input
            type="text"
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            placeholder="City"
          />
          <input
            type="text"
            value={form.state}
            onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
            placeholder="State"
          />
        </div>
        <input
          type="text"
          value={form.pincode}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, pincode: event.target.value.replace(/\D/g, "").slice(0, 6) }))
          }
          placeholder="Pincode"
        />
        <button className="primary-btn" type="submit">
          Save Profile
        </button>

        {user?.role === "admin" && (
          <div className="admin-quick-links">
            <Link to="/admin" className="ghost-btn">Seller Panel</Link>
            <Link to="/admin/products" className="ghost-btn">Products</Link>
            <Link to="/admin/orders" className="ghost-btn">Orders</Link>
          </div>
        )}
      </form>

      <div className="orders-card" id="orders">
        <h3>Order History</h3>
        {!visibleOrders.length ? (
          <p>No orders yet.</p>
        ) : (
          visibleOrders.map((order) => (
            <article key={order._id} className="order-item">
              <div className="order-main">
                <p>Order #{order._id.slice(-6)}</p>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className={`status-pill ${order.orderStatus}`}>{order.orderStatus}</span>
                {!!order.deliveryDetails?.trackingId && (
                  <span className="order-note">
                    Tracking: {order.deliveryDetails.trackingId} ({order.deliveryDetails.courierName || "Courier"})
                  </span>
                )}
                {!!order.paymentReference && (
                  <span className="order-note">Payment Ref: {order.paymentReference}</span>
                )}
                {!!order.paymentProofImage && (
                  <a className="text-btn" href={getImageUrl(order.paymentProofImage)} target="_blank" rel="noreferrer">
                    View Uploaded Payment Proof
                  </a>
                )}
                {!!order.deliveryDetails?.estimatedDelivery && (
                  <span className="order-note">
                    ETA: {order.deliveryDetails.estimatedDelivery}
                  </span>
                )}
              </div>
              <div className="order-actions">
                <p>{formatCurrency(order.totalAmount)}</p>
                <button
                  type="button"
                  className="text-btn danger-text"
                  onClick={() => cancelOrder(order._id)}
                  disabled={["shipped", "delivered", "cancelled"].includes(order.orderStatus)}
                >
                  Cancel
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default ProfilePage;
