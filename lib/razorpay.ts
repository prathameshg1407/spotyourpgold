// lib/razorpay.ts
import Razorpay from "razorpay";
import crypto from "crypto";

// ============================================
// Type Definitions
// ============================================

export interface RazorpayOrderOptions {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
  [key: string]: unknown;
}

export interface RazorpayPaymentResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: "card" | "netbanking" | "wallet" | "emi" | "upi" | "bank_transfer";
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string | null;
  card_id: string | null;
  card?: {
    id: string;
    entity: string;
    name: string;
    last4: string;
    network: string;
    type: string;
    issuer: string | null;
  } | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  customer_id: string | null;
  token_id: string | null;
  notes: Record<string, string>;
  fee: number | null;
  tax: number | null;
  error_code: string | null;
  error_description: string | null;
  error_source: string | null;
  error_step: string | null;
  error_reason: string | null;
  acquirer_data: {
    auth_code?: string;
    rrn?: string;
    upi_transaction_id?: string;
  } | null;
  created_at: number;
  [key: string]: unknown;
}

export interface RazorpayRefundResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, string>;
  receipt: string | null;
  acquirer_data: {
    arn?: string;
  } | null;
  created_at: number;
  batch_id: string | null;
  status: "pending" | "processed" | "failed";
  speed_processed: "normal" | "optimum";
  speed_requested: "normal" | "optimum";
  [key: string]: unknown;
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RefundOptions {
  paymentId: string;
  amount?: number;
  notes?: Record<string, string>;
  speed?: "normal" | "optimum";
}

// ============================================
// Razorpay Instance Management
// ============================================

let razorpayInstance: Razorpay | null = null;

/**
 * Get or create Razorpay instance (singleton pattern)
 */
export const getRazorpayInstance = (): Razorpay => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables."
      );
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
};

/**
 * Get Razorpay Key ID for client-side usage
 */
export const getRazorpayKeyId = (): string => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID environment variable is not set");
  }
  return keyId;
};

// ============================================
// Order Operations
// ============================================

/**
 * Create a new Razorpay order
 * @param options - Order creation options
 * @returns Created order details
 */
export const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
  notes = {},
}: RazorpayOrderOptions): Promise<RazorpayOrderResponse> => {
  const razorpay = getRazorpayInstance();

  // Validate amount
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt,
    notes,
    payment_capture: 1, // Auto capture payment
  };

  try {
    const order = await razorpay.orders.create(options);
    return order as unknown as RazorpayOrderResponse;
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    throw new Error(
      `Failed to create Razorpay order: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Fetch order details by order ID
 * @param orderId - Razorpay order ID
 * @returns Order details
 */
export const fetchOrderDetails = async (
  orderId: string
): Promise<RazorpayOrderResponse> => {
  const razorpay = getRazorpayInstance();

  try {
    const order = await razorpay.orders.fetch(orderId);
    return order as unknown as RazorpayOrderResponse;
  } catch (error) {
    console.error("Error fetching order details:", error);
    throw new Error(
      `Failed to fetch order details: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// ============================================
// Payment Operations
// ============================================

/**
 * Verify Razorpay payment signature
 * @param params - Verification parameters
 * @returns Whether the signature is valid
 */
export const verifyRazorpaySignature = ({
  orderId,
  paymentId,
  signature,
}: VerifySignatureParams): boolean => {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET environment variable is not set");
  }

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
};

/**
 * Fetch payment details by payment ID
 * @param paymentId - Razorpay payment ID
 * @returns Payment details
 */
export const fetchPaymentDetails = async (
  paymentId: string
): Promise<RazorpayPaymentResponse> => {
  const razorpay = getRazorpayInstance();

  if (!paymentId) {
    throw new Error("Payment ID is required");
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment as unknown as RazorpayPaymentResponse;
  } catch (error) {
    console.error("Error fetching payment details:", error);
    throw new Error(
      `Failed to fetch payment details: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Capture a payment (if not auto-captured)
 * @param paymentId - Razorpay payment ID
 * @param amount - Amount to capture in INR
 * @param currency - Currency code
 * @returns Captured payment details
 */
export const capturePayment = async (
  paymentId: string,
  amount: number,
  currency: string = "INR"
): Promise<RazorpayPaymentResponse> => {
  const razorpay = getRazorpayInstance();

  try {
    const payment = await razorpay.payments.capture(
      paymentId,
      Math.round(amount * 100),
      currency
    );
    return payment as unknown as RazorpayPaymentResponse;
  } catch (error) {
    console.error("Error capturing payment:", error);
    throw new Error(
      `Failed to capture payment: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// ============================================
// Refund Operations
// ============================================

/**
 * Create a refund for a payment
 * @param options - Refund options
 * @returns Refund details
 */
export const createRefund = async ({
  paymentId,
  amount,
  notes = {},
  speed = "normal",
}: RefundOptions): Promise<RazorpayRefundResponse> => {
  const razorpay = getRazorpayInstance();

  if (!paymentId) {
    throw new Error("Payment ID is required for refund");
  }

  const refundOptions: Record<string, unknown> = {
    speed,
    notes,
  };

  // If amount is provided, convert to paise; otherwise full refund
  if (amount !== undefined && amount > 0) {
    refundOptions.amount = Math.round(amount * 100);
  }

  try {
    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return refund as unknown as RazorpayRefundResponse;
  } catch (error) {
    console.error("Razorpay refund error:", error);
    throw new Error(
      `Failed to create refund: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Fetch refund details
 * @param paymentId - Razorpay payment ID
 * @param refundId - Razorpay refund ID
 * @returns Refund details
 */
export const fetchRefundDetails = async (
  paymentId: string,
  refundId: string
): Promise<RazorpayRefundResponse> => {
  const razorpay = getRazorpayInstance();

  try {
    const refund = await razorpay.payments.fetchRefund(paymentId, refundId);
    return refund as unknown as RazorpayRefundResponse;
  } catch (error) {
    console.error("Error fetching refund details:", error);
    throw new Error(
      `Failed to fetch refund details: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// ============================================
// Utility Functions
// ============================================

/**
 * Convert amount from paise to INR
 * @param amountInPaise - Amount in paise
 * @returns Amount in INR
 */
export const paiseToRupees = (amountInPaise: number): number => {
  return amountInPaise / 100;
};

/**
 * Convert amount from INR to paise
 * @param amountInRupees - Amount in INR
 * @returns Amount in paise
 */
export const rupeesToPaise = (amountInRupees: number): number => {
  return Math.round(amountInRupees * 100);
};

/**
 * Format amount for display
 * @param amount - Amount in INR
 * @returns Formatted string
 */
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Validate webhook signature
 * @param body - Raw request body
 * @param signature - X-Razorpay-Signature header
 * @param secret - Webhook secret
 * @returns Whether signature is valid
 */
export const verifyWebhookSignature = (
  body: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
};