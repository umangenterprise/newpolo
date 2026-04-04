export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

export const getProductGstPercent = (product) => {
  const parsed = Number(product?.gstPercent);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 28);
};

export const calculateCartTotals = (items = [], paymentMethod = "cod") => {
  const subtotal =
    items.reduce((sum, item) => sum + (Number(item.product?.price) || 0) * (Number(item.quantity) || 0), 0) || 0;
  const gstAmount =
    items.reduce((sum, item) => {
      const price = Number(item.product?.price) || 0;
      const quantity = Number(item.quantity) || 0;
      const gstPercent = getProductGstPercent(item.product);
      return sum + price * quantity * (gstPercent / 100);
    }, 0) || 0;
  const shippingFee = paymentMethod === "upi_qr" || subtotal > 1999 ? 0 : 99;
  const totalAmount = subtotal + gstAmount + shippingFee;

  return { subtotal, gstAmount, shippingFee, totalAmount };
};

const resolveBaseUrlForMobile = (rawUrl) => {
  if (!rawUrl) return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    const isLocalhost = ["localhost", "127.0.0.1"].includes(parsed.hostname);
    const hasWindow = typeof window !== "undefined";
    const mobileHost =
      hasWindow && !["localhost", "127.0.0.1"].includes(window.location.hostname)
        ? window.location.hostname
        : "";

    if (isLocalhost && mobileHost) {
      parsed.hostname = mobileHost;
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return rawUrl;
  }
};

export const parseShippingAddress = (address = "") => {
  const parts = String(address)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    fullName: parts[0] || "",
    phone: parts[1] || "",
    line1: parts[2] || "",
    line2: parts[3] || "",
    city: parts[4] || "",
    state: parts[5] || "",
    pincode: parts[6] || "",
    raw: String(address || "")
  };
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;

  const backendBase = resolveBaseUrlForMobile(
    import.meta.env.VITE_BACKEND_BASE || "http://localhost:5000"
  );
  return `${backendBase}${imagePath}`;
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const invalidPaymentValues = new Set([undefined, null, "", "yourupi@bank"]);

const getUpiQrDetails = (order) => {
  const upiId = import.meta.env.VITE_SELLER_UPI_ID;
  const sellerName = import.meta.env.VITE_SELLER_UPI_NAME || "Umang Bags";

  if (invalidPaymentValues.has(upiId)) {
    return null;
  }

  const invoiceNumber = `INV-${order._id.slice(-6).toUpperCase()}`;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    sellerName
  )}&am=${order.totalAmount}&cu=INR&tn=${encodeURIComponent(invoiceNumber)}`;

  return {
    sellerName,
    upiId,
    qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      upiUrl
    )}`
  };
};

const buildInvoiceHtml = (order, customer, invoiceOptions = {}) => {
  const invoiceNumber = `INV-${order._id.slice(-6).toUpperCase()}`;
  const customerName = customer?.name || "Customer";
  const customerPhone = customer?.phone || "-";
  const customerEmail = customer?.email || "-";
  const shippingAddress = order.shippingAddress || customer?.address || "-";
  const upiQr = getUpiQrDetails(order);
  const sellerName = import.meta.env.VITE_SELLER_UPI_NAME || "UmangShop";
  const returnAddress =
    import.meta.env.VITE_RETURN_ADDRESS ||
    "Noida, Uttar Pradesh 201301";
  const firstItem = order.orderItems?.[0];
  const awbNumber = String(order._id).replace(/\D/g, "").slice(0, 16) || "1490830573831583";
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
    awbNumber
  )}&code=Code128&dpi=96&imagetype=png`;
  const includeGst = Boolean(invoiceOptions?.includeGst);
  const amountBeforeTax = Math.max((Number(order.totalAmount) || 0) - (Number(order.gstAmount) || 0), 0);
  const gstAmount = includeGst ? Number(order.gstAmount) || 0 : 0;
  const amountAfterTax = Number(order.totalAmount) || 0;
  const gstPercent =
    includeGst && amountBeforeTax > 0 ? ((gstAmount / amountBeforeTax) * 100).toFixed(2) : "0.00";
  const sellerGstin = invoiceOptions?.gstin?.toString().trim() || "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 14px;
            background: #f6f6f6;
            color: #111;
          }
          .label {
            width: min(980px, 100%);
            margin: 0 auto;
            border: 2px solid #111;
            background: #fff;
          }
          .row {
            display: grid;
            grid-template-columns: 43% 57%;
          }
          .left,
          .right {
            min-height: 310px;
          }
          .left {
            border-right: 2px solid #111;
          }
          .block {
            padding: 12px;
            border-bottom: 2px solid #111;
          }
          .title {
            font-size: 20px;
            font-weight: 800;
            margin-bottom: 6px;
          }
          .muted {
            color: #333;
          }
          .cod-strip {
            background: #000;
            color: #fff;
            font-size: 17px;
            padding: 8px 12px;
            font-weight: 500;
          }
          .right-content {
            padding: 10px 12px 12px;
          }
          .right-grid {
            display: grid;
            grid-template-columns: 1fr 240px;
            gap: 10px;
            align-items: start;
          }
          .ship-title {
            font-size: 46px;
            font-weight: 800;
            line-height: 1;
            margin: 2px 0 8px;
          }
          .pickup {
            display: inline-block;
            background: #000;
            color: #fff;
            padding: 4px 10px;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .code {
            font-size: 36px;
            font-weight: 800;
            margin: 2px 0;
          }
          .qr {
            width: 240px;
            height: 240px;
            object-fit: contain;
            border: 1px solid #111;
          }
          .barcode-wrap {
            text-align: center;
            margin-top: 12px;
          }
          .barcode-num {
            font-size: 48px;
            font-weight: 800;
            line-height: 1;
            margin: 8px 0 2px;
          }
          .barcode {
            width: 92%;
            max-height: 95px;
            object-fit: contain;
          }
          .product {
            border-top: 2px solid #111;
            padding: 8px 12px 0;
          }
          .product-title {
            font-size: 40px;
            font-weight: 800;
            margin-bottom: 8px;
          }
          .product-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 0.5fr 1fr 1.5fr;
            gap: 10px;
            padding-bottom: 8px;
          }
          .head {
            font-size: 15px;
            font-weight: 800;
          }
          .val {
            font-size: 15px;
          }
          .tax {
            border-top: 2px solid #111;
            border-bottom: 2px solid #111;
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            padding: 6px 12px;
            font-weight: 800;
            font-size: 14px;
          }
          .foot {
            display: grid;
            grid-template-columns: 1.2fr 2fr;
          }
          .foot > div {
            padding: 8px 12px;
            border-right: 2px solid #111;
          }
          .foot > div:last-child {
            border-right: 0;
          }
        </style>
      </head>
      <body>
        <section class="label">
          <div class="row">
            <div class="left">
              <div class="block">
                <div class="head">Customer Address</div>
                <div class="title">${escapeHtml(customerName)}</div>
                <div class="muted">${escapeHtml(customerPhone)}</div>
                <div class="muted">${escapeHtml(customerEmail)}</div>
                <div style="margin-top:8px">${escapeHtml(shippingAddress)}</div>
              </div>
              <div class="block" style="border-bottom:0">
                <div class="head">If undelivered, return to:</div>
                <div style="margin-top:6px">${escapeHtml(sellerName)}</div>
                <div class="muted">${escapeHtml(returnAddress)}</div>
              </div>
            </div>
            <div class="right">
              <div class="cod-strip">${escapeHtml(order.paymentMethod.toUpperCase())}: Check payable amount on app</div>
              <div class="right-content">
                <div class="right-grid">
                  <div>
                    <div class="ship-title">Delivery</div>
                    <div class="pickup">Pickup</div>
                    <div class="muted">Destination Code</div>
                    <div class="code">${escapeHtml((shippingAddress.split(",")[4] || "CITY").trim())}</div>
                    <div class="muted">Return Code</div>
                    <div class="code">${escapeHtml((shippingAddress.split(",")[6] || "201301").trim())},3175537</div>
                  </div>
                  <div>
                    <img class="qr" src="${upiQr?.qrImageUrl || ""}" alt="QR Code" />
                  </div>
                </div>
                <div class="barcode-wrap">
                  <div class="barcode-num">${escapeHtml(awbNumber)}</div>
                  <img class="barcode" src="${barcodeUrl}" alt="Barcode" />
                </div>
              </div>
            </div>
          </div>
          <div class="product">
            <div class="product-title">Product Details</div>
            <div class="product-grid">
              <div>
                <div class="head">SKU</div>
                <div class="val">${escapeHtml(firstItem?.name || "Bag Item")}</div>
              </div>
              <div>
                <div class="head">Size</div>
                <div class="val">Free Size</div>
              </div>
              <div>
                <div class="head">Qty</div>
                <div class="val">${firstItem?.quantity || 1}</div>
              </div>
              <div>
                <div class="head">Color</div>
                <div class="val">Standard</div>
              </div>
              <div>
                <div class="head">Order No.</div>
                <div class="val">${escapeHtml(order._id)}</div>
              </div>
            </div>
          </div>
          <div class="tax">
            <span>TAX INVOICE</span>
            <span>Original For Recipient</span>
          </div>
          <div class="foot">
            <div>
              <div class="head">BILL TO / SHIP TO</div>
              <div class="val">${escapeHtml(customerName)}</div>
            </div>
            <div>
              <div class="val"><strong>Sold by:</strong> ${escapeHtml(sellerName)}</div>
              ${sellerGstin ? `<div class="val"><strong>GSTIN:</strong> ${escapeHtml(sellerGstin)}</div>` : ""}
              <div class="val"><strong>Invoice No:</strong> ${invoiceNumber}</div>
              <div class="val"><strong>Total (Before GST):</strong> ${formatCurrency(amountBeforeTax)}</div>
              ${includeGst ? `<div class="val"><strong>GST (${gstPercent}%):</strong> ${formatCurrency(gstAmount)}</div>` : ""}
              <div class="val"><strong>Total Payable:</strong> ${formatCurrency(includeGst ? amountAfterTax : amountBeforeTax)}</div>
              <div class="val"><strong>Status:</strong> ${escapeHtml(order.orderStatus)}</div>
            </div>
          </div>
        </section>
      </body>
    </html>
  `;
};

export const openInvoiceWindow = (order, customer, invoiceOptions = {}) => {
  const invoiceHtml = buildInvoiceHtml(order, customer, invoiceOptions);

  const invoiceWindow = window.open("", "_blank", "width=900,height=700");
  if (!invoiceWindow) return false;

  invoiceWindow.document.open();
  invoiceWindow.document.write(invoiceHtml);
  invoiceWindow.document.close();
  invoiceWindow.focus();
  setTimeout(() => invoiceWindow.print(), 300);

  return true;
};

export const downloadInvoiceFile = (order, customer, invoiceOptions = {}) => {
  const invoiceHtml = buildInvoiceHtml(order, customer, invoiceOptions);
  const blob = new Blob([invoiceHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const invoiceNumber = `invoice-${order._id.slice(-6).toLowerCase()}.html`;

  link.href = url;
  link.download = invoiceNumber;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
