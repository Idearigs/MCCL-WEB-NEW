import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Loader, Check } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "../contexts/CartContext";
import { useUserAuth } from "../contexts/UserAuthContext";
import { useNavigate, Link } from "react-router-dom";
import CheckoutAuthModal from "../components/CheckoutAuthModal";
import { trackInitiateCheckout, trackPurchase } from "../services/pixelService";
import { getMediaUrl } from "../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * Checkout — v2 restyle (design_handoff_mcculloch_bag_checkout_contact).
 * Stripped header, progress row, four accordion steps and an EFEADF summary
 * column. ALL Stripe / order / pixel logic is preserved verbatim from the
 * original — only presentation changed. Original at pages/Checkout.original.tsx.
 */

// Initialize Stripe promise at module level - only if key is available
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// Helper function to parse price from string or number
const getPriceAsNumber = (price: string | number): number => {
  if (typeof price === "number") return price;
  return parseFloat(price.replace("£", "").replace(",", ""));
};

const money = (n: number): string => `£${Math.round(n).toLocaleString("en-GB")}`;

// Delivery + payment options (placeholder pricing — replace before launch)
const DELIVERY_OPTIONS = [
  { id: "courier", name: "Insured courier", note: "2–3 working days, fully insured", price: 0 },
  { id: "named", name: "Named-day delivery", note: "Choose your delivery date", price: 15 },
  { id: "collect", name: "Collect in person", note: "From our Beeston showroom", price: 0 },
];
const PAYMENT_OPTIONS = [
  { id: "card", name: "Credit or debit card", note: "Visa, Mastercard, American Express" },
  { id: "transfer", name: "Bank transfer", note: "We’ll email account details" },
];

const ASSURANCES = ["Complimentary insured delivery", "30-day returns", "Lifetime aftercare & servicing"];

// ── Payment Form (Stripe) — logic unchanged, presentation restyled ──────────
const PaymentForm = ({
  email, firstName, lastName, address, apartment, city, postalCode, country, phone,
  total, cartItems, onSuccess, onError, isProcessing, setIsProcessing, cardElementOptions,
}: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  // Create the server-validated PaymentIntent for the current cart.
  const createIntent = async (): Promise<{ paymentIntentId: string; clientSecret: string }> => {
    const intentResponse = await fetch(`${API_URL}/payments/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: total,
        currency: "gbp",
        description: `McCulloch Jewelry Purchase - ${cartItems.length} items`,
        cartItems: cartItems.map((item: any) => ({
          product_id: item.id.toString(),
          name: item.name,
          quantity: item.quantity,
          price: getPriceAsNumber(item.price),
          variant_id: item.variant_id || null,
          type: item.type || null,
          metal: item.metal || null,
          selectedOptions: item.selectedOptions || null,
        })),
      }),
    });
    if (!intentResponse.ok) {
      const error = await intentResponse.json();
      throw new Error(error.message || "Failed to create payment intent");
    }
    const intentData = await intentResponse.json();
    return intentData.data;
  };

  // Confirm the order in our backend once Stripe reports the payment succeeded.
  const confirmOrder = async (paymentIntentId: string, payerName?: string, payerEmail?: string) => {
    const confirmResponse = await fetch(`${API_URL}/payments/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIntentId,
        customerEmail: payerEmail || email,
        customerName: payerName || `${firstName} ${lastName}`,
        shippingAddress: { street: address, apartment: apartment || undefined, city, postalCode, country, phone },
        cartItems: cartItems.map((item: any) => ({
          product_id: item.id.toString(),
          name: item.name,
          quantity: item.quantity,
          price: getPriceAsNumber(item.price),
          variant_id: item.variant_id || null,
          type: item.type || null,
          selectedOptions: item.selectedOptions || null,
          metal: item.metal || null,
          diamondSize: (item as any).diamondSize || null,
          size: item.size || null,
          brand: item.brand || null,
          variant_name: item.variant_name || null,
        })),
      }),
    });
    if (!confirmResponse.ok) {
      const error = await confirmResponse.json();
      throw new Error(error.message || "Failed to confirm payment");
    }
    const confirmData = await confirmResponse.json();
    onSuccess(confirmData.data);
  };

  // ── Apple Pay / Google Pay (Payment Request Button) ──────────────────────
  // The button only appears on devices/browsers that support a wallet with a
  // saved card (Safari/iOS for Apple Pay, Chrome/Android for Google Pay). It
  // reuses the exact same server-validated PaymentIntent as the card form.
  useEffect(() => {
    if (!stripe || !total || total <= 0) return;
    const pr = stripe.paymentRequest({
      country: "GB",
      currency: "gbp",
      total: { label: "McCulloch Fine Jewellery", amount: Math.round(total * 100) },
      requestPayerName: true,
      requestPayerEmail: true,
    });
    pr.canMakePayment().then((result) => { if (result) setPaymentRequest(pr); }).catch(() => {});

    pr.on("paymentmethod", async (ev: any) => {
      try {
        const { paymentIntentId, clientSecret } = await createIntent();
        const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
          clientSecret, { payment_method: ev.paymentMethod.id }, { handleActions: false }
        );
        if (confirmError) { ev.complete("fail"); onError(confirmError.message || "Wallet payment failed"); return; }
        ev.complete("success");
        if (paymentIntent && paymentIntent.status === "requires_action") {
          const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
          if (actionError) { onError(actionError.message || "Authentication failed"); return; }
        }
        setIsProcessing(true);
        await confirmOrder(paymentIntentId, ev.payerName, ev.payerEmail);
      } catch (err: any) {
        try { ev.complete("fail"); } catch { /* already completed */ }
        onError(err.message || "Wallet payment failed. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, total]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Stripe is not initialized. Please refresh the page.");
      return;
    }

    // Validation - Clear previous errors
    const errors: string[] = [];

    if (!email || email.trim() === "") {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Please enter a valid email address");
    }
    if (!firstName || firstName.trim() === "") errors.push("First name is required");
    if (!lastName || lastName.trim() === "") errors.push("Last name is required");
    if (!address || address.trim() === "") errors.push("Street address is required");
    if (!city || city.trim() === "") errors.push("City is required");
    if (!postalCode || postalCode.trim() === "") {
      errors.push("Postal code is required");
    } else if (postalCode.trim().length < 3) {
      errors.push("Postal code must be at least 3 characters");
    }
    if (!phone || phone.trim() === "") {
      errors.push("Phone number is required");
    } else if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
      errors.push("Please enter a valid phone number");
    }
    if (!country || country.trim() === "" || country === "Country/Region") errors.push("Country is required");
    if (cartItems.length === 0) errors.push("Your cart is empty. Please add items before checkout.");

    if (errors.length > 0) {
      onError(errors.join("\n"));
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create the server-validated payment intent
      const { paymentIntentId, clientSecret } = await createIntent();

      // Step 2: Confirm payment with Stripe using CardElement
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: `${firstName} ${lastName}`,
            email: email,
            address: {
              line1: address,
              line2: apartment || undefined,
              city: city,
              postal_code: postalCode,
              country: country === "United Kingdom" ? "GB" : "US",
            },
          },
        },
      });

      if (stripeError) throw new Error(stripeError.message || "Card payment failed");
      if (paymentIntent?.status !== "succeeded") throw new Error(`Payment status: ${paymentIntent?.status}`);

      // Step 3: Confirm order in backend
      await confirmOrder(paymentIntentId);
    } catch (error: any) {
      console.error("Payment error:", error);
      onError(error.message || "Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Apple Pay / Google Pay — only rendered on supported devices */}
      {paymentRequest && (
        <div style={{ marginBottom: 18 }}>
          <PaymentRequestButtonElement options={{ paymentRequest, style: { paymentRequestButton: { type: "default", theme: "dark", height: "48px" } } }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0 2px", color: T.muted, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            <span style={{ flex: 1, height: 1, background: T.ruleSoft }} />
            Or pay by card
            <span style={{ flex: 1, height: 1, background: T.ruleSoft }} />
          </div>
        </div>
      )}

      {/* Card Element */}
      <div style={{ background: "#FFFFFF", border: `1px solid ${T.ruleStrong}`, padding: "14px 14px" }}>
        <CardElement options={cardElementOptions} />
      </div>

      {/* Place order */}
      <button
        onClick={handlePayment}
        disabled={isProcessing || !stripe || !elements || cartItems.length === 0}
        className="cov2-place"
        style={{
          width: "100%", marginTop: 18, padding: "16px", background: T.ink, color: T.paper, border: 0,
          fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "background 0.25s",
          opacity: isProcessing || !stripe ? 0.7 : 1,
        }}
      >
        {isProcessing && <Loader className="cov2-spin" style={{ width: 15, height: 15 }} />}
        <span>{isProcessing ? "Processing…" : `Place order · ${money(total)}`}</span>
      </button>
    </>
  );
};

// ── Main ────────────────────────────────────────────────────────────────────
const CheckoutV2 = (): JSX.Element => {
  const { cartItems, clearCart } = useCart();
  const { user, isAuthenticated, isLoading } = useUserAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [keepUpdated, setKeepUpdated] = useState(true);
  const [country, setCountry] = useState("United Kingdom");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState("courier");
  const [payment, setPayment] = useState("card");

  // Payment state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [orderData, setOrderData] = useState<any>(null);

  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Accordion: which step is open, and how far the customer has progressed
  const STEP_LABELS = ["Contact", "Delivery address", "Delivery method", "Payment"];
  const [activeStep, setActiveStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [sumOpen, setSumOpen] = useState(false); // mobile summary bar

  const initiateCheckoutFired = useRef(false);

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0 && !successMessage) navigate("/cart");
  }, [cartItems.length, successMessage, navigate]);

  // Pre-fill from authenticated user
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.email && !email) setEmail(user.email);
      if (user.firstName && !firstName) setFirstName(user.firstName);
      if (user.lastName && !lastName) setLastName(user.lastName);
    }
  }, [isLoading, isAuthenticated]);

  // Facebook Pixel: InitiateCheckout
  useEffect(() => {
    if (cartItems.length > 0 && !initiateCheckoutFired.current) {
      const checkoutTotal = cartItems.reduce((t, item) => t + getPriceAsNumber(item.price) * item.quantity, 0);
      trackInitiateCheckout({
        content_ids: cartItems.map((item) => item.id.toString()),
        content_type: "product",
        value: checkoutTotal,
        currency: "GBP",
        num_items: cartItems.reduce((c, item) => c + item.quantity, 0),
        contents: cartItems.map((item) => ({ id: item.id.toString(), quantity: item.quantity, item_price: getPriceAsNumber(item.price) })),
      });
      initiateCheckoutFired.current = true;
    }
  }, [cartItems]);

  // ── Totals (per handoff: VAT-inclusive, delivery from selection) ──────────
  const subtotal = cartItems.reduce((t, item) => t + getPriceAsNumber(item.price) * item.quantity, 0);
  const deliveryCost = DELIVERY_OPTIONS.find((d) => d.id === delivery)?.price ?? 0;
  const total = subtotal + deliveryCost;
  const vat = Math.round(total - total / 1.2); // display-only, inclusive
  const pieces = cartItems.reduce((c, item) => c + item.quantity, 0);

  const handleSuccess = (data: any) => {
    setOrderData(data);
    setSuccessMessage(`Order confirmed! Order Number: ${data.orderNumber}`);

    trackPurchase({
      content_ids: cartItems.map((item) => item.id.toString()),
      content_type: "product",
      value: data.totalAmount || total,
      currency: "GBP",
      num_items: cartItems.reduce((c, item) => c + item.quantity, 0),
      contents: cartItems.map((item) => ({ id: item.id.toString(), quantity: item.quantity, item_price: getPriceAsNumber(item.price) })),
    });

    const orderItems = cartItems.map((item: any) => ({
      product_name: item.name,
      product_type: item.type || null,
      quantity: item.quantity,
      unit_price: getPriceAsNumber(item.price),
      total_price: getPriceAsNumber(item.price) * item.quantity,
      image: item.image || null,
      attributes: item.selectedOptions || { metal: item.metal, size: item.size, brand: item.brand, variant_name: item.variant_name },
    }));

    // Snapshot the delivery / payment choices for the confirmation page.
    const delOpt = DELIVERY_OPTIONS.find((d) => d.id === delivery)!;
    const payOpt = PAYMENT_OPTIONS.find((p) => p.id === payment)!;

    clearCart();

    setTimeout(() => {
      navigate("/thank-you", {
        state: {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          totalAmount: data.totalAmount,
          customerEmail: email,
          customerName: `${firstName} ${lastName}`,
          status: data.status,
          items: orderItems,
          shippingAddress: { line1: address, line2: apartment, city, postcode: postalCode, country, phone },
          deliveryName: delOpt.name,
          deliveryCost: delOpt.price,
          paymentMethod: payOpt.name,
        },
      });
    }, 2000);
  };

  const handleError = (error: string) => setErrorMessage(error);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "15px",
        color: T.ink,
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        "::placeholder": { color: "#A9A29A", fontWeight: "300" },
      },
      invalid: { color: "#c0392b" },
    },
  };

  // ── Live summaries (delivery & payment generated from selection) ──────────
  const del = DELIVERY_OPTIONS.find((d) => d.id === delivery)!;
  const pay = PAYMENT_OPTIONS.find((p) => p.id === payment)!;
  const summaries = [
    email || "—",
    [firstName, lastName].filter(Boolean).join(" ") + (address ? `, ${address}` : "") + (postalCode ? `, ${postalCode}` : "") || "—",
    `${del.name} — ${del.price === 0 ? "Free" : money(del.price)}`,
    pay.name,
  ];

  const goNext = (i: number) => { setReached((r) => Math.max(r, i + 1)); setActiveStep(i + 1); };
  const editStep = (i: number) => setActiveStep(i);

  // Where a summary line item links back to. Prefer the exact path captured when
  // it was added; otherwise fall back to a slug-based route by product type.
  const productHref = (item: any): string | null => {
    if (item.productUrl) return item.productUrl;
    if (item.type === "watch" && item.slug) return `/watches/${item.slug}`;
    if (item.slug) return `/product/${item.slug}`;
    return null;
  };
  // Flag the intent to return so a "Jump to checkout" tab appears on the product
  // page (rendered globally by ReturnToCheckout, cleared on arriving at checkout).
  const markReturnToCheckout = () => { try { sessionStorage.setItem("mcc_return_checkout", "1"); } catch { /* storage blocked */ } };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const input: React.CSSProperties = {
    width: "100%", padding: "12px 0", background: "transparent", border: 0, borderBottom: `1px solid ${T.ruleStrong}`,
    outline: "none", color: T.ink, fontFamily: FONT_BODY, fontSize: 15,
  };
  const fieldLabel: React.CSSProperties = { display: "block", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 3 };
  const continueBtn: React.CSSProperties = {
    marginTop: 22, padding: "13px 30px", background: T.ink, color: T.paper, border: 0,
    fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", transition: "background 0.25s",
  };

  const RadioCard = ({ selected, name, note, right, onClick }: { selected: boolean; name: string; note: string; right?: React.ReactNode; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", display: "grid", gridTemplateColumns: right ? "16px 1fr auto" : "16px 1fr",
        alignItems: "center", gap: 14, padding: "17px 16px", cursor: "pointer",
        background: selected ? T.tint : T.paper, border: `1px solid ${selected ? T.ink : T.ruleSoft}`,
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <span style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${selected ? T.ink : T.ruleStrong}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.ink }} />}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, color: T.ink }}>{name}</span>
        <span style={{ display: "block", fontSize: 12.5, color: T.muted, marginTop: 2 }}>{note}</span>
      </span>
      {right && <span style={{ fontSize: 13, color: T.ink, whiteSpace: "nowrap" }}>{right}</span>}
    </button>
  );

  // Step header (numeral + title + edit/summary)
  const StepHeader = ({ i }: { i: number }) => {
    const roman = ["I", "II", "III", "IV"][i];
    const active = activeStep === i;
    const done = i < reached && !active;
    const upcoming = i > reached && !active;
    const numeralColor = active ? T.gold : done ? T.muted : "#C4BCB0";
    return (
      <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: numeralColor }}>{roman}</span>
          <span style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: upcoming ? "#A9A29A" : T.ink }}>{STEP_LABELS[i]}</span>
          {done && (
            <button onClick={() => editStep(i)} style={{ background: "transparent", border: 0, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, cursor: "pointer" }}>Edit</button>
          )}
        </div>
        {done && (
          <div style={{ marginLeft: 42, marginTop: 6, fontSize: 13, color: T.muted, overflow: "hidden", textOverflow: "ellipsis" }}>{summaries[i]}</div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: T.paper, fontFamily: FONT_BODY, color: T.body, overflowX: "hidden" }}>
      <style>{`
        @keyframes cov2spin { to { transform: rotate(360deg) } }
        .cov2-spin { animation: cov2spin 0.7s linear infinite; }
        .cov2-place:hover { background: ${T.inkDeep} !important; }
        .cov2-continue:hover { background: ${T.inkDeep}; }
        .cov2-input:focus { border-bottom-color: ${T.ink} !important; }
        .cov2-prodname { transition: color 0.2s; }
        a:hover .cov2-prodname { color: ${T.gold} !important; }
        .cov2-mobilesum { display: none; }
        @media (max-width: 940px) {
          .cov2-grid { grid-template-columns: 1fr !important; }
          .cov2-summary { display: none !important; }
          .cov2-mobilesum { display: block; }
          .cov2-progress { overflow-x: auto; }
          .cov2-left { max-width: 100% !important; }
        }
        @media (max-width: 560px) {
          .cov2-secure { display: none !important; }
          .cov2-secure-m { display: flex !important; }
          .cov2-back { font-size: 11px !important; }
          .cov2-steps-full { display: none !important; }
          .cov2-steps-mini { display: flex !important; }
          .cov2-2col { grid-template-columns: 1fr !important; gap: 14px !important; }
        }
      `}</style>

      {/* Auth Modal */}
      <CheckoutAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthComplete={() => setShowAuthModal(false)}
      />

      {/* Stripped header — on mobile "Secure checkout" sits beneath the wordmark */}
      <header style={{ borderBottom: `1px solid ${T.rule}`, background: T.paper }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "18px clamp(20px, 4vw, 48px)" }}>
          <Link to="/cart" className="cov2-back" style={{ fontSize: 12, color: T.muted, textDecoration: "none", justifySelf: "start" }}>← Back to bag</Link>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: "0.04em", color: T.ink, lineHeight: 1 }}>McCulloch</div>
            <div className="cov2-secure-m" style={{ display: "none", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 6, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted }}>
              <Check size={11} strokeWidth={2} style={{ color: T.gold }} /> Secure checkout
            </div>
          </div>
          <div className="cov2-secure" style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 7, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted }}>
            <Check size={13} strokeWidth={2} style={{ color: T.gold }} /> Secure checkout
          </div>
        </div>
      </header>

      {/* Mobile order-summary bar */}
      <div className="cov2-mobilesum" style={{ background: T.tint, borderBottom: `1px solid ${T.rule}` }}>
        <button
          onClick={() => setSumOpen((v) => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px clamp(20px, 4vw, 48px)", background: "transparent", border: 0, cursor: "pointer" }}
        >
          <span style={{ fontSize: 12, color: T.ink }}>Order summary {sumOpen ? "−" : "+"}</span>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: T.ink }}>{money(total)}</span>
        </button>
        {sumOpen && (
          <div style={{ padding: "0 clamp(20px, 4vw, 48px) 18px" }}>
            {cartItems.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.body, padding: "5px 0" }}>
                <span>{item.name} × {item.quantity}</span>
                <span>{money(getPriceAsNumber(item.price) * item.quantity)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${T.ruleSoft}`, marginTop: 8, paddingTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.body, marginBottom: 6 }}><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.body, marginBottom: 6 }}><span>{del.name}</span><span>{del.price === 0 ? "Free" : money(del.price)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.muted }}><span>VAT (incl.)</span><span>{money(vat)}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="cov2-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(380px, 0.8fr)", minHeight: "calc(100vh - 88px)" }}>
        {/* Left — form */}
        <div style={{ padding: "clamp(28px, 4vw, 56px) clamp(20px, 4vw, 48px)", minWidth: 0 }}>
          <div className="cov2-left" style={{ maxWidth: 620, margin: "0 auto", width: "100%", minWidth: 0 }}>
            {/* Progress row */}
            <div className="cov2-progress" style={{ marginBottom: 34 }}>
              {/* Full stepper — tablet/desktop */}
              <div className="cov2-steps-full" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: "max-content" }}>
                {STEP_LABELS.map((label, i) => (
                  <React.Fragment key={label}>
                    <span style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: i <= Math.max(activeStep, reached) ? T.ink : "#A9A29A", whiteSpace: "nowrap" }}>{label}</span>
                    {i < STEP_LABELS.length - 1 && <span style={{ width: 22, height: 1, background: T.ruleStrong }} />}
                  </React.Fragment>
                ))}
              </div>
              {/* Compact indicator — phones (the full row is too wide to read) */}
              <div className="cov2-steps-mini" style={{ display: "none", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.gold }}>Step {Math.min(activeStep, STEP_LABELS.length - 1) + 1} of {STEP_LABELS.length}</span>
                <span style={{ width: 18, height: 1, background: T.ruleStrong }} />
                <span style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.ink }}>{STEP_LABELS[Math.min(activeStep, STEP_LABELS.length - 1)]}</span>
              </div>
            </div>

            {/* I — Contact */}
            <StepHeader i={0} />
            {activeStep === 0 && (
              <div style={{ marginLeft: 42, marginTop: 16, marginBottom: 8 }}>
                {!isAuthenticated ? (
                  <button onClick={() => setShowAuthModal(true)} style={{ background: "transparent", border: 0, color: T.gold, fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 14 }}>Already have an account? Log in</button>
                ) : (
                  user && <div style={{ fontSize: 12, color: T.gold, marginBottom: 14 }}>Signed in as {user.email}</div>
                )}
                <label style={fieldLabel}>Email</label>
                <input className="cov2-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={input} />
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16, fontSize: 12.5, color: T.body, cursor: "pointer" }}>
                  <input type="checkbox" checked={keepUpdated} onChange={(e) => setKeepUpdated(e.target.checked)} style={{ marginTop: 2, accentColor: T.ink }} />
                  Keep me up to date on new collections and private viewings
                </label>
                <div><button className="cov2-continue" style={continueBtn} onClick={() => goNext(0)}>Continue</button></div>
              </div>
            )}

            {/* II — Delivery address */}
            <div style={{ marginTop: 22 }}><StepHeader i={1} /></div>
            {activeStep === 1 && (
              <div style={{ marginLeft: 42, marginTop: 16, marginBottom: 8 }}>
                <label style={fieldLabel}>Country / region</label>
                <select className="cov2-input" value={country} onChange={(e) => setCountry(e.target.value)} style={{ ...input, appearance: "none", cursor: "pointer" }}>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                </select>
                <div className="cov2-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 14 }}>
                  <div><label style={fieldLabel}>First name</label><input className="cov2-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={input} /></div>
                  <div><label style={fieldLabel}>Last name</label><input className="cov2-input" value={lastName} onChange={(e) => setLastName(e.target.value)} style={input} /></div>
                </div>
                <div style={{ marginTop: 14 }}><label style={fieldLabel}>Address</label><input className="cov2-input" value={address} onChange={(e) => setAddress(e.target.value)} style={input} /></div>
                <div style={{ marginTop: 14 }}><label style={fieldLabel}>Apartment, suite, etc. (optional)</label><input className="cov2-input" value={apartment} onChange={(e) => setApartment(e.target.value)} style={input} /></div>
                <div className="cov2-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 14 }}>
                  <div><label style={fieldLabel}>Town / city</label><input className="cov2-input" value={city} onChange={(e) => setCity(e.target.value)} style={input} /></div>
                  <div><label style={fieldLabel}>Postcode</label><input className="cov2-input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} style={input} /></div>
                </div>
                <div style={{ marginTop: 14 }}><label style={fieldLabel}>Telephone</label><input className="cov2-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={input} /></div>
                <div><button className="cov2-continue" style={continueBtn} onClick={() => goNext(1)}>Continue</button></div>
              </div>
            )}

            {/* III — Delivery method */}
            <div style={{ marginTop: 22 }}><StepHeader i={2} /></div>
            {activeStep === 2 && (
              <div style={{ marginLeft: 42, marginTop: 16, marginBottom: 8, display: "grid", gap: 10 }}>
                {DELIVERY_OPTIONS.map((o) => (
                  <RadioCard key={o.id} selected={delivery === o.id} name={o.name} note={o.note} right={o.price === 0 ? "Free" : money(o.price)} onClick={() => setDelivery(o.id)} />
                ))}
                <div><button className="cov2-continue" style={continueBtn} onClick={() => goNext(2)}>Continue</button></div>
              </div>
            )}

            {/* IV — Payment */}
            <div style={{ marginTop: 22 }}><StepHeader i={3} /></div>
            {activeStep === 3 && (
              <div style={{ marginLeft: 42, marginTop: 16, marginBottom: 8 }}>
                <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>All transactions are secure and encrypted.</p>
                <div style={{ display: "grid", gap: 10 }}>
                  {PAYMENT_OPTIONS.map((o) => (
                    <RadioCard key={o.id} selected={payment === o.id} name={o.name} note={o.note} onClick={() => setPayment(o.id)} />
                  ))}
                </div>

                {/* Card fields render only when card selected */}
                {payment === "card" && (
                  <div style={{ marginTop: 18 }}>
                    {stripePromise ? (
                      <Elements stripe={stripePromise}>
                        <PaymentForm
                          email={email} firstName={firstName} lastName={lastName} address={address} apartment={apartment}
                          city={city} postalCode={postalCode} country={country} phone={phone} total={total} cartItems={cartItems}
                          onSuccess={handleSuccess} onError={handleError} isProcessing={isProcessing} setIsProcessing={setIsProcessing}
                          cardElementOptions={cardElementOptions}
                        />
                      </Elements>
                    ) : (
                      <div style={{ padding: 16, textAlign: "center", background: "#FBF6E9", border: `1px solid ${T.ruleSoft}`, color: T.muted }}>
                        <AlertCircle style={{ width: 18, height: 18, margin: "0 auto 8px", color: T.gold }} />
                        <p style={{ fontSize: 13 }}>Payment system is being configured. Please contact us to complete your order.</p>
                      </div>
                    )}
                  </div>
                )}
                {payment === "transfer" && (
                  <div style={{ marginTop: 18, padding: 18, background: T.tint, border: `1px solid ${T.ruleSoft}`, fontSize: 13.5, color: T.body, lineHeight: 1.6 }}>
                    Prefer bank transfer? Continue and we’ll email account details and hold your piece for 3 working days pending payment.
                  </div>
                )}

                <p style={{ fontSize: 12, color: T.muted, marginTop: 16, lineHeight: 1.6 }}>
                  By placing your order you agree to our terms of sale and privacy policy. VAT is included in the price shown.
                </p>

                {/* Error / success */}
                {errorMessage && (
                  <div style={{ display: "flex", gap: 12, padding: 14, background: "#FBEDEA", border: "1px solid #E4C4BD", marginTop: 16 }}>
                    <AlertCircle style={{ width: 18, height: 18, color: "#c0392b", flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: "#8f3222", whiteSpace: "pre-line" }}>{errorMessage}</div>
                  </div>
                )}
                {successMessage && (
                  <div style={{ display: "flex", gap: 12, padding: 14, background: "#EDF3EC", border: "1px solid #C3D6BD", marginTop: 16 }}>
                    <CheckCircle style={{ width: 18, height: 18, color: "#3f7d34", flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: 13, color: "#31662a", display: "block" }}>{successMessage}</span>
                      {orderData && (
                        <div style={{ fontSize: 12, color: "#3f7d34", marginTop: 6, lineHeight: 1.6 }}>
                          <div>Order ID: {orderData.orderId}</div>
                          <div>Total: £{orderData.totalAmount}</div>
                          <div>Status: {orderData.status}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Assurances (mobile — no side column) */}
            <div className="cov2-mobilesum" style={{ marginTop: 34, borderTop: `1px solid ${T.rule}`, paddingTop: 20 }}>
              {ASSURANCES.map((a) => (
                <div key={a} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 12.5, color: T.body }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.gold }} /> {a}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — summary column */}
        <aside className="cov2-summary" style={{ background: T.tint, borderLeft: `1px solid ${T.rule}`, padding: "clamp(28px, 4vw, 56px) clamp(24px, 3vw, 44px)" }}>
          <div style={{ position: "sticky", top: 40 }}>
            {/* Line items */}
            <div style={{ marginBottom: 22 }}>
              {cartItems.map((item, i) => {
                const href = productHref(item);
                const img = (
                  <div style={{ position: "relative", width: 68, aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden" }}>
                    <img src={getMediaUrl(item.image)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: T.ink, color: T.paper, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.quantity}</span>
                  </div>
                );
                const details = (
                  <div style={{ minWidth: 0 }}>
                    <div className={href ? "cov2-prodname" : undefined} style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: T.ink, lineHeight: 1.2 }}>{item.name}</div>
                    <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.type === "watch" ? [item.brand, item.variant_name].filter(Boolean).join(" · ") : [item.metal, item.size && `Size ${item.size}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                );
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "68px 1fr auto", gap: 16, alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.ruleSoft}` }}>
                    {href ? <Link to={href} onClick={markReturnToCheckout} title={`View ${item.name}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>{img}</Link> : img}
                    {href ? <Link to={href} onClick={markReturnToCheckout} title={`View ${item.name}`} style={{ display: "block", minWidth: 0, textDecoration: "none", color: "inherit" }}>{details}</Link> : details}
                    <div style={{ fontSize: 13.5, color: T.ink, whiteSpace: "nowrap" }}>{money(getPriceAsNumber(item.price) * item.quantity)}</div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: T.body, marginBottom: 10 }}><span>Subtotal</span><span style={{ color: T.ink }}>{money(subtotal)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: T.body, marginBottom: 10 }}><span>{del.name}</span><span style={{ color: del.price === 0 ? T.gold : T.ink }}>{del.price === 0 ? "Free" : money(del.price)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: T.body, marginBottom: 10 }}><span>VAT (incl.)</span><span style={{ color: T.ink }}>{money(vat)}</span></div>

            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: 16, marginTop: 8, borderTop: `1px solid ${T.ruleSoft}` }}>
              <span style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ink }}>Total</span>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 32, color: T.ink, lineHeight: 1 }}>{money(total)}</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 6, textAlign: "right" }}>Includes VAT · Free insured UK delivery</div>

            {/* Assurances */}
            <div style={{ marginTop: 26 }}>
              {ASSURANCES.map((a, i) => (
                <div key={a} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i === 0 ? "none" : `1px dashed ${T.ruleSoft}`, fontSize: 12.5, color: T.body }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.gold, flexShrink: 0 }} /> {a}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CheckoutV2;
