import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../api/apiClient";
import {
  downloadInvoiceFile,
  formatCurrency,
  getImageUrl,
  openInvoiceWindow,
  parseShippingAddress
} from "../../utils/helpers.js";

const allowedTransitions = {
  processing: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingByOrder, setEditingByOrder] = useState({});

  const load = async () => {
    const { data } = await api.get("/admin/orders");
    setOrders(data);
  };

  useEffect(() => {
    load();
  }, []);

  const patchOrder = (orderId, updates) => {
    setEditingByOrder((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        ...updates
      }
    }));
  };

  const visibleOrders = orders.filter((order) => {
    const customer = order.user?.name?.toLowerCase() || "";
    const email = order.customerEmail?.toLowerCase() || order.user?.email?.toLowerCase() || "";
    const shortId = order._id.slice(-6).toLowerCase();
    const query = search.trim().toLowerCase();
    const matchSearch = !query || customer.includes(query) || email.includes(query) || shortId.includes(query);
    const matchStatus = statusFilter === "all" || order.orderStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <section className="container section-gap">
      <h2>Seller Orders</h2>
      <div className="filters-row">
        <input
          className="price-input"
          placeholder="Search by name, email, order id"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="price-input"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Status</option>
          <option value="processing">Processing</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="admin-list">
        {visibleOrders.map((order) => {
          const shipping = parseShippingAddress(order.shippingAddress);
          const draft = editingByOrder[order._id] || {};
          const invoiceOptions = {
            includeGst: Boolean(draft.includeGst),
            gstPercent: draft.gstPercent ?? "18",
            gstin: draft.gstin ?? ""
          };
          const validStatusOptions = [order.orderStatus, ...(allowedTransitions[order.orderStatus] || [])];
          const selectedStatus = draft.orderStatus || order.orderStatus;

          return (
            <article key={order._id} className="admin-item long admin-order-card">
              <div>
                <p>{order.user?.name || shipping.fullName || "User"}</p>
                <span>{order.customerEmail || order.user?.email}</span>
                <div className="order-meta">
                  <span>Order #{order._id.slice(-6)}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className={`status-pill ${order.orderStatus}`}>{order.orderStatus}</span>
                </div>
                <div className="order-meta">
                  <span>Phone: {shipping.phone || "-"}</span>
                  <span>Address: {shipping.raw || "-"}</span>
                </div>
              </div>
              <div>
                <p>{formatCurrency(order.totalAmount)}</p>
                <span>{order.paymentMethod}</span>
                {!!order.paymentReference && (
                  <div className="order-meta">
                    <span>UTR: {order.paymentReference}</span>
                  </div>
                )}
                {!!order.paymentProofImage && (
                  <div className="order-meta">
                    <a className="text-btn" href={getImageUrl(order.paymentProofImage)} target="_blank" rel="noreferrer">
                      View Proof
                    </a>
                  </div>
                )}
                <div className="order-meta">
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => {
                      const opened = openInvoiceWindow(order, order.user, invoiceOptions);
                      if (!opened) {
                        toast.error("Invoice window blocked. Please allow pop-ups.");
                      }
                    }}
                  >
                    Invoice
                  </button>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() => {
                      downloadInvoiceFile(order, order.user, invoiceOptions);
                      toast.success("Invoice downloaded");
                    }}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    className="text-btn danger-text"
                    onClick={async () => {
                      const shouldDelete = window.confirm(
                        "Are you sure? This will permanently delete this order."
                      );
                      if (!shouldDelete) return;

                      try {
                        await api.delete(`/admin/orders/${order._id}`);
                        toast.success("Order deleted permanently");
                        await load();
                      } catch (error) {
                        toast.error(error.response?.data?.message || "Delete failed");
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="admin-order-actions">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={invoiceOptions.includeGst}
                    onChange={(event) => patchOrder(order._id, { includeGst: event.target.checked })}
                  />
                  <span>Add GST in invoice</span>
                </label>
                {invoiceOptions.includeGst && (
                  <>
                    <input
                      className="price-input"
                      type="number"
                      min="0"
                      max="28"
                      step="0.1"
                      placeholder="GST % (e.g. 18)"
                      value={invoiceOptions.gstPercent}
                      onChange={(event) => patchOrder(order._id, { gstPercent: event.target.value })}
                    />
                    <input
                      className="price-input"
                      placeholder="Seller GSTIN (optional)"
                      value={invoiceOptions.gstin}
                      onChange={(event) => patchOrder(order._id, { gstin: event.target.value.toUpperCase() })}
                    />
                  </>
                )}
                <select
                  value={selectedStatus}
                  onChange={(event) => patchOrder(order._id, { orderStatus: event.target.value })}
                >
                  {validStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={draft.paymentStatus || order.paymentStatus}
                  onChange={(event) => patchOrder(order._id, { paymentStatus: event.target.value })}
                >
                  <option value="pending">Payment Pending</option>
                  <option value="paid">Payment Paid</option>
                  <option value="failed">Payment Failed</option>
                </select>
                <input
                  className="price-input"
                  placeholder="Courier name"
                  value={draft.courierName ?? order.deliveryDetails?.courierName ?? ""}
                  onChange={(event) => patchOrder(order._id, { courierName: event.target.value })}
                />
                <input
                  className="price-input"
                  placeholder="Tracking ID"
                  value={draft.trackingId ?? order.deliveryDetails?.trackingId ?? ""}
                  onChange={(event) => patchOrder(order._id, { trackingId: event.target.value })}
                />
                <input
                  className="price-input"
                  placeholder="Estimated delivery (e.g. 3-5 days)"
                  value={draft.estimatedDelivery ?? order.deliveryDetails?.estimatedDelivery ?? ""}
                  onChange={(event) =>
                    patchOrder(order._id, { estimatedDelivery: event.target.value })
                  }
                />
                <button
                  type="button"
                  className="primary-btn"
                  onClick={async () => {
                    try {
                      await api.put(`/admin/orders/${order._id}`, {
                        orderStatus: draft.orderStatus || order.orderStatus,
                        paymentStatus: draft.paymentStatus || order.paymentStatus,
                        deliveryDetails: {
                          courierName:
                            draft.courierName ?? order.deliveryDetails?.courierName ?? "",
                          trackingId: draft.trackingId ?? order.deliveryDetails?.trackingId ?? "",
                          estimatedDelivery:
                            draft.estimatedDelivery ?? order.deliveryDetails?.estimatedDelivery ?? "",
                          sellerNote: draft.sellerNote ?? order.deliveryDetails?.sellerNote ?? ""
                        }
                      });
                      toast.success("Order updated");
                      await load();
                    } catch (error) {
                      toast.error(error.response?.data?.message || "Update failed");
                    }
                  }}
                >
                  Save Update
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default AdminOrdersPage;
