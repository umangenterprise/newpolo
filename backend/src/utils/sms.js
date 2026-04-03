const invalidSmsValues = new Set(["", "replace_with_twilio_sid", "replace_with_twilio_token", "replace_with_twilio_phone"]);

const normalizeEnv = (value) => (typeof value === "string" ? value.trim() : "");
const normalizePhone = (value) => {
  const digits = value?.toString().replace(/\D/g, "") || "";
  if (!digits) return "";
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return value?.toString().trim().startsWith("+") ? value.toString().trim() : `+${digits}`;
};

const hasValid = (value) => !invalidSmsValues.has(normalizeEnv(value).toLowerCase());

export const isSmsConfigured = () =>
  hasValid(process.env.TWILIO_ACCOUNT_SID) &&
  hasValid(process.env.TWILIO_AUTH_TOKEN) &&
  hasValid(process.env.TWILIO_PHONE_NUMBER);

export const sendOrderOtpSms = async ({ phone, otp }) => {
  if (!otp || !phone || !isSmsConfigured()) {
    return false;
  }

  const to = normalizePhone(phone);
  if (!to) {
    return false;
  }

  const sid = normalizeEnv(process.env.TWILIO_ACCOUNT_SID);
  const token = normalizeEnv(process.env.TWILIO_AUTH_TOKEN);
  const from = normalizePhone(process.env.TWILIO_PHONE_NUMBER);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `Umang OTP: ${otp}. Valid for ${process.env.ORDER_OTP_EXPIRY_MINUTES || "10"} minutes.`
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Twilio SMS failed (${response.status}): ${payload}`);
  }

  return true;
};

export const sendOrderConfirmedSms = async ({ phone, customerName, orderId, estimatedDelivery }) => {
  if (!phone || !isSmsConfigured()) {
    return false;
  }

  const to = normalizePhone(phone);
  if (!to) {
    return false;
  }

  const sid = normalizeEnv(process.env.TWILIO_ACCOUNT_SID);
  const token = normalizeEnv(process.env.TWILIO_AUTH_TOKEN);
  const from = normalizePhone(process.env.TWILIO_PHONE_NUMBER);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const shortOrderId = orderId?.toString().slice(-6) || "N/A";
  const etaText = estimatedDelivery?.toString().trim() || "2-4 days";
  const name = customerName?.toString().trim() || "Customer";
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `Hi ${name}, your Umang order #${shortOrderId} is confirmed. Expected delivery in ${etaText}.`
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Twilio SMS failed (${response.status}): ${payload}`);
  }

  return true;
};

export const sendOrderPlacedSms = async ({ phone, customerName, orderId, estimatedDelivery }) => {
  if (!phone || !isSmsConfigured()) {
    return false;
  }

  const to = normalizePhone(phone);
  if (!to) {
    return false;
  }

  const sid = normalizeEnv(process.env.TWILIO_ACCOUNT_SID);
  const token = normalizeEnv(process.env.TWILIO_AUTH_TOKEN);
  const from = normalizePhone(process.env.TWILIO_PHONE_NUMBER);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const shortOrderId = orderId?.toString().slice(-6) || "N/A";
  const etaText = estimatedDelivery?.toString().trim() || "2-4 days";
  const name = customerName?.toString().trim() || "Customer";
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `Hi ${name}, your Umang order #${shortOrderId} is placed successfully. Expected delivery in ${etaText}.`
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Twilio SMS failed (${response.status}): ${payload}`);
  }

  return true;
};

export const sendOrderCancelledSms = async ({ phone, customerName, orderId }) => {
  if (!phone || !isSmsConfigured()) {
    return false;
  }

  const to = normalizePhone(phone);
  if (!to) {
    return false;
  }

  const sid = normalizeEnv(process.env.TWILIO_ACCOUNT_SID);
  const token = normalizeEnv(process.env.TWILIO_AUTH_TOKEN);
  const from = normalizePhone(process.env.TWILIO_PHONE_NUMBER);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const shortOrderId = orderId?.toString().slice(-6) || "N/A";
  const name = customerName?.toString().trim() || "Customer";
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `Hi ${name}, your Umang order #${shortOrderId} has been cancelled.`
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Twilio SMS failed (${response.status}): ${payload}`);
  }

  return true;
};
