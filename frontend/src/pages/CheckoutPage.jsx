import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import { useApp } from "../context/useApp.jsx";
import { calculateCartTotals, formatCurrency } from "../utils/helpers.js";
import { loadRazorpayScript } from "../utils/razorpay.js";

const invalidRazorpayValues = new Set(["", "rzp_test_replace", "replace_key_secret", undefined]);
const invalidUpiValues = new Set(["", "yourupi@bank", undefined]);
const emptyAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: ""
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, fetchCart, user } = useApp();
  const razorpayEnabled = !invalidRazorpayValues.has(import.meta.env.VITE_RAZORPAY_KEY_ID);
  const upiId = import.meta.env.VITE_SELLER_UPI_ID;
  const upiName = import.meta.env.VITE_SELLER_UPI_NAME || "Umang Bags";
  const upiEnabled = !invalidUpiValues.has(upiId);

  const [form, setForm] = useState({
    shippingAddress: emptyAddress,
    customerEmail: "",
    paymentMethod: "cod",
    paymentReference: ""
  });
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const { subtotal, gstAmount, shippingFee, totalAmount } = calculateCartTotals(
    cart.items,
    form.paymentMethod
  );
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId || "")}&pn=${encodeURIComponent(
    upiName
  )}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent("Umang Order Payment")}`;
  const upiQrImage = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiLink
  )}`;

  const formatProfileAddress = (address = "") => {
    const parts = address
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (parts.length < 7) return emptyAddress;

    const [fullName, phone, line1, line2, city, state, pincode] = parts;
    return { fullName, phone, line1, line2, city, state, pincode };
  };

  const updateAddressField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [key]: value
      }
    }));
  };

  const isAddressComplete = Object.values(form.shippingAddress).every((value) => value?.trim());
  const isValidPhone = /^\d{10}$/.test(form.shippingAddress.phone?.trim() || "");
  const isValidPincode = /^\d{6}$/.test(form.shippingAddress.pincode?.trim() || "");

  useEffect(() => {
    if (user) {
      const parsedAddress = formatProfileAddress(user.address);
      setForm((prev) => ({
        ...prev,
        shippingAddress: {
          ...parsedAddress,
          phone: user.phone || parsedAddress.phone
        },
        customerEmail: user.email || prev.customerEmail
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!paymentProof) {
      setPaymentProofPreview("");
      return;
    }

    const url = URL.createObjectURL(paymentProof);
    setPaymentProofPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [paymentProof]);

  const placeOrder = async () => {
    if (!isAddressComplete) {
      toast.error("Please fill complete address including pincode and state.");
      return;
    }

    if (!isValidPhone) {
      toast.error("Please enter valid 10-digit phone number.");
      return;
    }

    if (!isValidPincode) {
      toast.error("Please enter valid 6-digit pincode.");
      return;
    }

    if (form.paymentMethod === "razorpay" && !razorpayEnabled) {
      toast.error("Razorpay abhi configured nahi hai. Cash on Delivery use karo ya real keys add karo.");
      return;
    }

    if (form.paymentMethod === "upi_qr" && !upiEnabled) {
      toast.error("UPI QR setup nahi hai. Seller UPI ID add karo ya COD use karo.");
      return;
    }

    if (form.paymentMethod === "upi_qr" && !/^[A-Za-z0-9-]{6,30}$/.test(form.paymentReference.trim())) {
      toast.error("Valid UTR / transaction ID enter karo.");
      return;
    }

    if (form.paymentMethod === "upi_qr" && !paymentProof) {
      toast.error("UPI payment screenshot upload karo.");
      return;
    }

    setLoading(true);
    try {
      let data;

      if (form.paymentMethod === "upi_qr") {
        const payload = new FormData();
        payload.append("paymentMethod", form.paymentMethod);
        payload.append("customerEmail", form.customerEmail);
        payload.append("paymentReference", form.paymentReference);
        payload.append("shippingAddress", JSON.stringify(form.shippingAddress));
        payload.append("paymentProof", paymentProof);

        const response = await api.post("/orders", payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        data = response.data;
      } else {
        const response = await api.post("/orders", form);
        data = response.data;
      }

      if (form.paymentMethod === "cod" || form.paymentMethod === "upi_qr") {
        const etaText = data?.order?.deliveryDetails?.estimatedDelivery;
        toast.success(
          form.paymentMethod === "upi_qr"
            ? `Order placed. Payment proof submitted for verification.${etaText ? ` Expected delivery: ${etaText}` : ""}`
            : `Order placed with COD${etaText ? `. Expected delivery: ${etaText}` : ""}`
        );
        await fetchCart();
        navigate("/profile");
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load Razorpay SDK");
        return;
      }

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error("Razorpay key missing in frontend env");
        return;
      }

      const options = {
        key: razorpayKey,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Umang",
        description: "Bag Purchase",
        order_id: data.razorpayOrder.id,
        handler: async (response) => {
          const verifyResponse = await api.post("/orders/verify-payment", {
            orderId: data.order._id,
            ...response
          });
          const etaText = verifyResponse.data?.order?.deliveryDetails?.estimatedDelivery;
          toast.success(`Payment successful, order confirmed${etaText ? `. Expected delivery: ${etaText}` : ""}`);
          await fetchCart();
          navigate("/profile");
        },
        theme: {
          color: "#C24A2E"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => toast.error("Payment failed"));
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Address submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container section-gap auth-wrap">
      <div className="auth-card">
        <h2>Delivery Address</h2>
        <input
          placeholder="Full name"
          value={form.shippingAddress.fullName}
          onChange={(event) => updateAddressField("fullName", event.target.value)}
        />
        <input
          placeholder="Phone number"
          value={form.shippingAddress.phone}
          onChange={(event) =>
            updateAddressField("phone", event.target.value.replace(/\D/g, "").slice(0, 10))
          }
        />
        <input
          type="email"
          placeholder="Email address"
          value={form.customerEmail}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              customerEmail: event.target.value
            }))
          }
        />
        <input
          placeholder="House no / Flat / Street"
          value={form.shippingAddress.line1}
          onChange={(event) => updateAddressField("line1", event.target.value)}
        />
        <input
          placeholder="Area / Landmark"
          value={form.shippingAddress.line2}
          onChange={(event) => updateAddressField("line2", event.target.value)}
        />
        <div className="two-col-grid">
          <input
            placeholder="City"
            value={form.shippingAddress.city}
            onChange={(event) => updateAddressField("city", event.target.value)}
          />
          <input
            placeholder="State"
            value={form.shippingAddress.state}
            onChange={(event) => updateAddressField("state", event.target.value)}
          />
        </div>
        <input
          placeholder="Pincode"
          value={form.shippingAddress.pincode}
          onChange={(event) =>
            updateAddressField("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))
          }
        />

        <select
          value={form.paymentMethod}
          onChange={(event) => setForm((prev) => ({ ...prev, paymentMethod: event.target.value }))}
        >
          <option value="cod">Cash on Delivery</option>
          <option value="upi_qr" disabled={!upiEnabled}>
            {upiEnabled ? "UPI QR (PhonePe / Paytm / GPay)" : "UPI QR (setup required)"}
          </option>
          <option value="razorpay" disabled={!razorpayEnabled}>
            {razorpayEnabled ? "Razorpay" : "Razorpay (setup required)"}
          </option>
        </select>

        {!upiEnabled && (
          <p className="helper-text">
            UPI QR payment ke liye seller UPI ID setup karni hogi.
          </p>
        )}

        {!razorpayEnabled && (
          <p className="helper-text">
            Online payment ke liye valid Razorpay keys chahiye. Abhi aap COD se order place kar
            sakte ho.
          </p>
        )}
        <div className="helper-text">
          <p>Subtotal: {formatCurrency(subtotal)}</p>
          <p>GST: {formatCurrency(gstAmount)}</p>
          <p>Shipping: {shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}</p>
          <p>Total payable: {formatCurrency(totalAmount)}</p>
        </div>

        {form.paymentMethod === "upi_qr" && upiEnabled && (
          <div className="upi-box">
            <p className="helper-text">
              Total {formatCurrency(totalAmount)} pay karo is QR se, phir neeche UTR/Txn ID dalo.
            </p>
            <p className="helper-text">UPI QR payment par shipping fee: Free</p>
            <img src={upiQrImage} alt="UPI QR" />
            <p className="helper-text">UPI ID: {upiId}</p>
            <input
              placeholder="UTR / Transaction ID"
              value={form.paymentReference}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  paymentReference: event.target.value.toUpperCase()
                }))
              }
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPaymentProof(event.target.files?.[0] || null)}
            />
            {paymentProofPreview && (
              <img src={paymentProofPreview} alt="Payment proof preview" className="proof-preview" />
            )}
          </div>
        )}

        <button onClick={placeOrder} className="primary-btn" disabled={loading}>
          {loading ? "Placing order..." : "Place Order"}
        </button>
      </div>
    </section>
  );
};

export default CheckoutPage;
