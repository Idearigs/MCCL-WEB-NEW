import React, { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "../contexts/CartContext";
import { useUserAuth } from "../contexts/UserAuthContext";
import { useNavigate, Link } from "react-router-dom";
import CheckoutAuthModal from "../components/CheckoutAuthModal";
import { trackInitiateCheckout, trackPurchase } from "../services/pixelService";
import { getMediaUrl } from "../config/api";
import { T, FONT_DISPLAY, FONT_LOGO, FONT_BODY } from "../components/home-v2/tokens";
import { GROUND, TILE } from "../components/home-v2/listingShared";
import PaymentBadges from "../components/PaymentBadges";

/**
 * Checkout, light redesign (Nov 2026). A stripped header, four numbered steps that open one
 * at a time and fold to a one-line summary when done, boxed fields with visible labels, and
 * the order summary on the page's one sand panel.
 *
 * ALL Stripe / order / pixel logic is preserved verbatim from the previous version; only the
 * presentation changed, plus two small behaviours:
 *   1. "Continue" now checks the step's own fields (same rules the payment button already
 *      applied at the very end) and says what is missing there and then.
 *   2. Every step body stays mounted and is shown or hidden by the step's data-state, so
 *      typed details and the card field survive stepping back.
 * Original at pages/Checkout.original.tsx.
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
// Display only: "Clubmaster Classic - Chrono - Black" reads "Clubmaster Classic, Chrono, Black".
const tidy = (n: string): string => (n || "").replace(/\s+-\s+/g, ", ");

// Delivery + payment options (placeholder pricing — replace before launch)
const DELIVERY_OPTIONS = [
  { id: "courier", name: "Insured courier", note: "Signed for. Made-to-order pieces take up to 6 weeks", price: 0 },
  { id: "collect", name: "Collect in person", note: "From our Beeston showroom", price: 0 },
];
const PAYMENT_OPTIONS = [
  { id: "card", name: "Credit or debit card", note: "Visa, Mastercard, American Express" },
  { id: "transfer", name: "Bank transfer", note: "Arranged with us by telephone or email" },
];

const ASSURANCES = ["Complimentary insured delivery", "30-day returns on ready-to-ship", "Lifetime aftercare & servicing"];


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
          // Pass the cart image so the confirmation emails show the item thumbnail —
          // essential for wedding rings, which have no products-table image to fall back on.
          image: item.image || item.image_url || null,
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
      {/* Apple Pay / Google Pay: only rendered on supported devices */}
      {paymentRequest && (
        <div style={{ marginBottom: 20 }}>
          <PaymentRequestButtonElement options={{ paymentRequest, style: { paymentRequestButton: { type: "default", theme: "dark", height: "52px" } } }} />
          <div className="co-or"><span />Or pay by card<span /></div>
        </div>
      )}

      <label className="co-label">Card details</label>
      <div className="co-card" data-cardbox>
        <CardElement options={cardElementOptions} />
      </div>

      <button
        onClick={handlePayment}
        disabled={isProcessing || !stripe || !elements || cartItems.length === 0}
        className="co-btn co-place"
        style={{ opacity: isProcessing || !stripe ? 0.7 : 1 }}
      >
        {isProcessing && <span className="co-spin" aria-hidden="true" />}
        <span>{isProcessing ? "Processing…" : `Place order · ${money(total)}`}</span>
      </button>
    </>
  );
};

// ── Main ────────────────────────────────────────────────────────────────────
const CheckoutV2 = (): JSX.Element => {
  const { cartItems, clearCart, removeItem } = useCart();
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
  const [stepError, setStepError] = useState(""); // what "Continue" found missing in the open step

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
        color: T.text,
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        "::placeholder": { color: "#8E897E" },
      },
      invalid: { color: "#c0392b" },
    },
  };


  // ── Live summaries (delivery & payment generated from selection) ──────────
  const del = DELIVERY_OPTIONS.find((d) => d.id === delivery)!;
  const pay = PAYMENT_OPTIONS.find((p) => p.id === payment)!;
  const summaries = [
    email,
    [[firstName, lastName].filter(Boolean).join(" "), address, postalCode].filter(Boolean).join(", "),
    `${del.name}, ${del.price === 0 ? "free" : money(del.price)}`,
    pay.name,
  ];

  // The same checks the payment button runs, applied to the step being left.
  const stepProblems = (i: number): string[] => {
    const errors: string[] = [];
    if (i === 0) {
      if (!email || email.trim() === "") errors.push("Email is required");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Please enter a valid email address");
    }
    if (i === 1) {
      if (!firstName || firstName.trim() === "") errors.push("First name is required");
      if (!lastName || lastName.trim() === "") errors.push("Last name is required");
      if (!address || address.trim() === "") errors.push("Street address is required");
      if (!city || city.trim() === "") errors.push("City is required");
      if (!postalCode || postalCode.trim() === "") errors.push("Postal code is required");
      else if (postalCode.trim().length < 3) errors.push("Postal code must be at least 3 characters");
      if (!phone || phone.trim() === "") errors.push("Phone number is required");
      else if (!/^[\d\s\-\+\(\)]+$/.test(phone)) errors.push("Please enter a valid phone number");
    }
    return errors;
  };
  const goNext = (i: number) => {
    const problems = stepProblems(i);
    if (problems.length) { setStepError(problems.join("\n")); return; }
    setStepError("");
    setReached((r) => Math.max(r, i + 1));
    setActiveStep(i + 1);
  };
  const editStep = (i: number) => { setStepError(""); setActiveStep(i); };
  const stateOf = (i: number): "active" | "done" | "todo" => (activeStep === i ? "active" : i < reached ? "done" : "todo");

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

  const lineNote = (item: any): string =>
    item.type === "watch" ? [item.brand, item.variant_name].filter(Boolean).join(" · ") : [item.metal, item.size && `Size ${item.size}`].filter(Boolean).join(" · ");

  // Plain render helpers (called as functions, not mounted as components) so the fields and
  // the Stripe card element inside them are never remounted by a re-render.
  const step = (i: number, children: React.ReactNode) => (
    <section key={i} className="co-step" data-step={i} data-state={stateOf(i)}>
      <div className="co-stephead">
        <span className="co-num" aria-hidden="true">
          <b>{i + 1}</b>
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5.2l3.2 3.2L11 1.4" stroke={T.gold} strokeWidth="1.4" /></svg>
        </span>
        <h2>{STEP_LABELS[i]}</h2>
        <button type="button" className="co-link co-edit" data-edit={i} onClick={() => editStep(i)}>Edit</button>
      </div>
      <div className="co-sumline" data-sum={i}>{summaries[i]}</div>
      <div className="co-body">
        {children}
        {activeStep === i && stepError && <div className="co-error" role="alert" style={{ marginTop: 18 }}>{stepError}</div>}
      </div>
    </section>
  );

  const radio = ({ id, selected, name, note, right, onClick, group }: { id: string; selected: boolean; name: string; note: string; right?: React.ReactNode; onClick: () => void; group: string }) => (
    <button key={id} type="button" role="radio" aria-checked={selected} data-radio={group} className="co-radio" onClick={onClick}>
      <span className="co-dot" />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, color: T.text }}>{name}</span>
        <span style={{ display: "block", fontSize: 13.5, color: T.textMuted, marginTop: 3, lineHeight: 1.5 }}>{note}</span>
      </span>
      {right && <span style={{ fontSize: 14, color: T.text, whiteSpace: "nowrap" }}>{right}</span>}
    </button>
  );

  const totals = () => (
    <>
      <div className="co-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      <div className="co-row"><span>{del.name}</span><span>{del.price === 0 ? "Free" : money(del.price)}</span></div>
      <div className="co-row"><span>VAT (included)</span><span>{money(vat)}</span></div>
    </>
  );

  const lines = () => (
    <div>
      {cartItems.map((item, i) => {
        const href = productHref(item);
        const img = <span className="co-thumb"><img src={getMediaUrl(item.image)} alt={item.name} /></span>;
        const details = (
          <span style={{ display: "block", minWidth: 0 }}>
            <span className="co-pname">{tidy(item.name)}</span>
            {lineNote(item) && <span className="co-pnote">{lineNote(item)}</span>}
            {item.quantity > 1 && <span className="co-pnote">Quantity {item.quantity}</span>}
          </span>
        );
        return (
          <div key={i} className="co-line">
            {href ? <Link to={href} onClick={markReturnToCheckout} title={`View ${item.name}`}>{img}</Link> : img}
            {href ? <Link to={href} onClick={markReturnToCheckout} title={`View ${item.name}`} style={{ minWidth: 0 }}>{details}</Link> : details}
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <span style={{ fontSize: 14.5, color: T.text, whiteSpace: "nowrap" }}>{money(getPriceAsNumber(item.price) * item.quantity)}</span>
              <button type="button" className="co-link" onClick={() => removeItem(i)} title="Remove item" style={{ fontSize: 10.5 }}>Remove</button>
            </span>
          </div>
        );
      })}
    </div>
  );

  const pageX = "clamp(20px, 4vw, 56px)";

  return (
    <div className="co" style={{ minHeight: "100vh", background: GROUND, fontFamily: FONT_BODY, color: T.text, overflowX: "clip" }}>
      <style>{`
        .co a { color: inherit; text-decoration: none; }
        @keyframes coSpin { to { transform: rotate(360deg) } }
        .co-spin { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid rgba(248,246,240,0.35); border-top-color: ${T.cream}; animation: coSpin 0.7s linear infinite; }

        .co-top { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 20px ${pageX}; background: ${T.cream}; border-bottom: 1px solid ${T.line}; }
        .co-word { font-family: ${FONT_LOGO}; font-size: 25px; letter-spacing: 0.16em; line-height: 1; color: ${T.text}; text-align: center; }
        .co-secure { justify-self: end; display: inline-flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.text}; }

        .co-link { cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.ruleStrong}; padding: 0 0 3px; font-family: ${FONT_BODY}; font-size: 11.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; transition: border-color 0.2s ease; }
        .co-link:hover { border-bottom-color: ${T.gold}; }
        .co-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 17px 34px; background: ${T.ink}; color: ${T.cream}; border: 0; cursor: pointer; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; transition: background 0.3s ease; }
        .co-btn:hover { background: ${T.text}; }
        .co-place { width: 100%; margin-top: 20px; }

        .co-grid { display: grid; grid-template-columns: minmax(0, 1.18fr) minmax(380px, 0.82fr); min-height: calc(100vh - 66px); }
        .co-left { padding: clamp(30px, 4vw, 60px) ${pageX} clamp(56px, 6vw, 96px); min-width: 0; }
        .co-form { max-width: 600px; margin: 0 auto; }
        .co-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(32px, 3.4vw, 44px); line-height: 1.1; margin: 0 0 clamp(24px, 3vw, 38px); color: ${T.text}; }

        /* steps: everything is driven by data-state = active | done | todo */
        .co-step { border-top: 1px solid ${T.line}; padding: 24px 0; }
        .co-step:last-of-type { border-bottom: 1px solid ${T.line}; }
        .co-stephead { display: grid; grid-template-columns: 30px 1fr auto; align-items: center; gap: 16px; }
        .co-stephead h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 21px; line-height: 1.2; margin: 0; color: ${T.text}; }
        .co-num { width: 30px; height: 30px; border-radius: 50%; border: 1px solid ${T.ruleStrong}; display: flex; align-items: center; justify-content: center; font-size: 13px; color: ${T.text}; }
        .co-num b { font-weight: 400; }
        .co-num svg { display: none; }
        .co-edit, .co-sumline, .co-body { display: none; }
        .co-sumline { margin: 6px 0 0 46px; font-size: 14px; color: ${T.textMuted}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .co-body { margin: 22px 0 6px 46px; }
        .co-step[data-state="active"] .co-num { background: ${T.ink}; border-color: ${T.ink}; color: ${T.cream}; }
        .co-step[data-state="active"] .co-body { display: block; }
        .co-step[data-state="done"] .co-num { border-color: ${T.gold}; }
        .co-step[data-state="done"] .co-num b { display: none; }
        .co-step[data-state="done"] .co-num svg { display: block; }
        .co-step[data-state="done"] .co-edit { display: inline-block; }
        .co-step[data-state="done"] .co-sumline { display: block; }
        .co-step[data-state="todo"] h2 { color: ${T.textMuted}; }

        /* fields */
        .co-label { display: block; font-size: 13px; color: ${T.text}; margin-bottom: 7px; }
        .co-label em { font-style: normal; color: ${T.textMuted}; }
        .co-input { display: block; width: 100%; height: 52px; padding: 0 15px; background: #FFFFFF; border: 1px solid ${T.ruleStrong}; border-radius: 0; outline: none; color: ${T.text}; font-family: ${FONT_BODY}; font-size: 16px; transition: border-color 0.2s ease; }
        .co-input::placeholder { color: #8E897E; }
        .co-input:hover { border-color: #B5A990; }
        .co-input:focus { border-color: ${T.text}; }
        select.co-input { appearance: none; -webkit-appearance: none; cursor: pointer; background: #FFFFFF url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23332F2A'/%3E%3C/svg%3E") no-repeat right 16px center; }
        .co-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .co-fields > .is-wide { grid-column: 1 / -1; }
        .co-check { display: flex; align-items: flex-start; gap: 11px; margin-top: 16px; font-size: 14px; line-height: 1.5; color: ${T.text}; cursor: pointer; }
        .co-check input { margin-top: 3px; width: 16px; height: 16px; accent-color: ${T.ink}; flex: none; }
        .co-card { background: #FFFFFF; border: 1px solid ${T.ruleStrong}; padding: 17px 15px; }
        .co-or { display: flex; align-items: center; gap: 14px; margin-top: 20px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.textMuted}; }
        .co-or span { flex: 1; height: 1px; background: ${T.line}; }

        .co-radios { display: grid; gap: 10px; }
        .co-radio { width: 100%; text-align: left; display: grid; grid-template-columns: 18px 1fr auto; align-items: center; gap: 15px; padding: 18px; cursor: pointer; background: transparent; border: 1px solid ${T.line}; font-family: ${FONT_BODY}; transition: border-color 0.2s ease, background 0.2s ease; }
        .co-radio:hover { border-color: ${T.ruleStrong}; }
        .co-radio[aria-checked="true"] { border-color: ${T.text}; background: ${TILE}; }
        .co-dot { width: 18px; height: 18px; border-radius: 50%; border: 1px solid ${T.ruleStrong}; display: flex; align-items: center; justify-content: center; }
        .co-radio[aria-checked="true"] .co-dot { border-color: ${T.text}; }
        .co-radio[aria-checked="true"] .co-dot::after { content: ""; width: 8px; height: 8px; border-radius: 50%; background: ${T.text}; }

        .co-note { font-size: 13.5px; line-height: 1.65; color: ${T.textMuted}; }
        .co-panel { margin-top: 18px; padding: 18px; border: 1px solid ${T.line}; font-size: 14.5px; line-height: 1.7; color: ${T.text}; }
        .co-panel a { border-bottom: 1px solid ${T.ruleStrong}; }
        .co-error { padding: 14px 16px; background: #FBEDEA; border: 1px solid #E4C4BD; font-size: 14px; line-height: 1.6; color: #8F3222; white-space: pre-line; }
        .co-ok { padding: 14px 16px; background: #EDF3EC; border: 1px solid #C3D6BD; font-size: 14px; line-height: 1.6; color: #31662A; margin-top: 16px; }

        /* summary: the page's one sand panel. Only full-strength text sits on sand. */
        .co-side { background: ${T.sand}; border-left: 1px solid ${T.line}; padding: clamp(30px, 4vw, 60px) clamp(24px, 3vw, 48px); }
        .co-sticky { position: sticky; top: 36px; max-width: 460px; }
        .co-side h2, .co-msum h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 24px; margin: 0 0 14px; color: ${T.text}; }
        .co-line { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 16px 0; border-bottom: 1px solid ${T.ruleStrong}; }
        .co-thumb { position: relative; display: block; width: 72px; aspect-ratio: 1 / 1.1; background: ${GROUND}; overflow: hidden; }
        .co-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 8%; mix-blend-mode: multiply; }
        .co-pname { display: block; font-size: 15px; line-height: 1.4; color: ${T.text}; }
        .co-pnote { display: block; margin-top: 3px; font-size: 13px; color: ${T.text}; opacity: 0.82; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .co-row { display: flex; justify-content: space-between; gap: 16px; font-size: 14.5px; color: ${T.text}; margin-top: 12px; }
        .co-total { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding-top: 18px; margin-top: 18px; border-top: 1px solid ${T.ruleStrong}; }
        .co-total span:first-child { font-size: 11.5px; letter-spacing: 0.18em; text-transform: uppercase; }
        .co-total span:last-child { font-family: ${FONT_DISPLAY}; font-size: 32px; line-height: 1; }
        .co-assure { list-style: none; margin: 26px 0 0; padding: 22px 0 0; border-top: 1px solid ${T.ruleStrong}; display: grid; gap: 11px; }
        .co-assure li { display: flex; align-items: center; gap: 12px; font-size: 13.5px; color: ${T.text}; }

        .co-msum, .co-massure { display: none; }
        @media (max-width: 940px) {
          .co-grid { grid-template-columns: 1fr; min-height: 0; }
          .co-side { display: none; }
          .co-msum { display: block; background: ${T.sand}; border-bottom: 1px solid ${T.line}; }
          .co-msum > button { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px ${pageX}; background: transparent; border: 0; cursor: pointer; font-family: ${FONT_BODY}; color: ${T.text}; }
          .co-msum-in { padding: 0 ${pageX} 22px; }
          .co-massure { display: grid; border-top: 0; padding-top: 0; margin-top: 34px; }
        }
        @media (max-width: 600px) {
          .co-top { grid-template-columns: auto 1fr; padding: 16px ${pageX}; }
          .co-word { text-align: right; font-size: 21px; }
          .co-secure { display: none; }
          .co-fields { grid-template-columns: 1fr; gap: 16px; }
          .co-body, .co-sumline { margin-left: 0; }
          .co-btn { width: 100%; }
          .co-radio { padding: 16px 14px; gap: 12px; }
        }
      `}</style>

      {/* Auth Modal */}
      <CheckoutAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthComplete={() => setShowAuthModal(false)}
      />

      {/* Stripped header */}
      <header className="co-top">
        <span style={{ justifySelf: "start" }}><Link to="/cart" className="co-link">Back to bag</Link></span>
        <Link to="/" className="co-word" aria-label="McCulloch, home">McCulloch</Link>
        <span className="co-secure">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true"><rect x="1" y="6" width="10" height="7.2" stroke={T.gold} /><path d="M3.4 6V4a2.6 2.6 0 015.2 0v2" stroke={T.gold} /></svg>
          Secure checkout
        </span>
      </header>

      {/* Phone: order summary folds away under the header */}
      <div className="co-msum">
        <button type="button" data-msum aria-expanded={sumOpen} onClick={() => setSumOpen((v) => !v)}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 14 }}>
            {sumOpen ? "Hide order summary" : "Show order summary"}
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" style={{ transform: sumOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s ease" }}><path d="M1 1l4 4 4-4" stroke="currentColor" /></svg>
          </span>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 24 }}>{money(total)}</span>
        </button>
        <div className="co-msum-in" data-msumbody style={{ display: sumOpen ? "block" : "none" }}>
          {lines()}
          {totals()}
        </div>
      </div>

      <div className="co-grid">
        {/* Left: the four steps */}
        <div className="co-left">
          <div className="co-form">
            <h1 className="co-h1">Checkout</h1>

            {/* 1. Contact */}
            {step(0, <>
              {!isAuthenticated ? (
                <div style={{ marginBottom: 18, fontSize: 14, color: T.text }}>Already have an account? <button type="button" className="co-link" onClick={() => setShowAuthModal(true)} style={{ marginLeft: 6 }}>Log in</button></div>
              ) : (
                user && <div style={{ marginBottom: 18, fontSize: 14, color: T.text }}>Signed in as {user.email}</div>
              )}
              <label className="co-label" htmlFor="co-email">Email</label>
              <input id="co-email" className="co-input" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <label className="co-check">
                <input type="checkbox" checked={keepUpdated} onChange={(e) => setKeepUpdated(e.target.checked)} />
                Keep me up to date on new collections and private viewings
              </label>
              <div style={{ marginTop: 24 }}><button type="button" className="co-btn" data-next={0} onClick={() => goNext(0)}>Continue</button></div>
            </>)}

            {/* 2. Delivery address */}
            {step(1, <>
              <div className="co-fields">
                <div className="is-wide">
                  <label className="co-label" htmlFor="co-country">Country / region</label>
                  <select id="co-country" className="co-input" autoComplete="country-name" value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
                <div><label className="co-label" htmlFor="co-first">First name</label><input id="co-first" className="co-input" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                <div><label className="co-label" htmlFor="co-last">Last name</label><input id="co-last" className="co-input" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                <div className="is-wide"><label className="co-label" htmlFor="co-addr">Address</label><input id="co-addr" className="co-input" autoComplete="address-line1" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                <div className="is-wide"><label className="co-label" htmlFor="co-apt">Apartment, suite, etc. <em>(optional)</em></label><input id="co-apt" className="co-input" autoComplete="address-line2" value={apartment} onChange={(e) => setApartment(e.target.value)} /></div>
                <div><label className="co-label" htmlFor="co-city">Town / city</label><input id="co-city" className="co-input" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} /></div>
                <div><label className="co-label" htmlFor="co-post">Postcode</label><input id="co-post" className="co-input" autoComplete="postal-code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></div>
                <div className="is-wide"><label className="co-label" htmlFor="co-tel">Telephone</label><input id="co-tel" className="co-input" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              </div>
              <div style={{ marginTop: 24 }}><button type="button" className="co-btn" data-next={1} onClick={() => goNext(1)}>Continue</button></div>
            </>)}

            {/* 3. Delivery method */}
            {step(2, <>
              <div className="co-radios" role="radiogroup" aria-label="Delivery method">
                {DELIVERY_OPTIONS.map((o) => (
                  radio({ id: o.id, group: "delivery", selected: delivery === o.id, name: o.name, note: o.note, right: o.price === 0 ? "Free" : money(o.price), onClick: () => setDelivery(o.id) })
                ))}
              </div>
              <div style={{ marginTop: 24 }}><button type="button" className="co-btn" data-next={2} onClick={() => goNext(2)}>Continue</button></div>
            </>)}

            {/* 4. Payment. Kept mounted (hidden when inactive) so the Stripe CardElement keeps
                the entered card details if the customer steps back to fix an earlier field. */}
            {step(3, <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px 20px", marginBottom: 16 }}>
                <span className="co-note">All transactions are secure and encrypted.</span>
                <PaymentBadges align="flex-start" />
              </div>
              <div className="co-radios" role="radiogroup" aria-label="Payment method">
                {PAYMENT_OPTIONS.map((o) => (
                  radio({ id: o.id, group: "payment", selected: payment === o.id, name: o.name, note: o.note, onClick: () => setPayment(o.id) })
                ))}
              </div>

              {/* Card fields render only when card selected */}
              {payment === "card" && (
                <div style={{ marginTop: 22 }} data-paycard>
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
                    <div className="co-panel" style={{ marginTop: 0 }}>Payment system is being configured. Please contact us to complete your order.</div>
                  )}
                </div>
              )}
              {payment === "transfer" && (
                <div className="co-panel" data-paytransfer>
                  To pay by bank transfer, call us on <a href="tel:01159257552">0115 925 7552</a> or email <a href="mailto:has@mccullochjewellers.co.uk">has@mccullochjewellers.co.uk</a> and we will send the account details.
                </div>
              )}

              <p className="co-note" style={{ margin: "18px 0 0" }}>
                By placing your order you agree to our <Link to="/terms" style={{ borderBottom: `1px solid ${T.ruleStrong}` }}>terms of sale</Link> and <Link to="/privacy" style={{ borderBottom: `1px solid ${T.ruleStrong}` }}>privacy policy</Link>. VAT is included in the price shown.
              </p>

              {/* Error / success */}
              {errorMessage && <div className="co-error" role="alert" style={{ marginTop: 16 }}>{errorMessage}</div>}
              {successMessage && (
                <div className="co-ok" role="status">
                  <span style={{ display: "block" }}>{successMessage}</span>
                  {orderData && (
                    <span style={{ display: "block", fontSize: 13, marginTop: 6 }}>
                      Order ID: {orderData.orderId}<br />Total: £{orderData.totalAmount}<br />Status: {orderData.status}
                    </span>
                  )}
                </div>
              )}
            </>)}

            {/* Assurances (phone and tablet: there is no side column) */}
            <ul className="co-assure co-massure">
              {ASSURANCES.map((a) => <li key={a}><svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true"><path d="M1 5.2l3.2 3.2L11 1.4" stroke={T.gold} strokeWidth="1.3" /></svg>{a}</li>)}
            </ul>
          </div>
        </div>

        {/* Right: order summary */}
        <aside className="co-side">
          <div className="co-sticky">
            <h2>Your order</h2>
            {lines()}
            <div style={{ marginTop: 18 }}>{totals()}</div>
            <div className="co-total"><span>Total</span><span>{money(total)}</span></div>
            <ul className="co-assure">
              {ASSURANCES.map((a) => <li key={a}><svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true"><path d="M1 5.2l3.2 3.2L11 1.4" stroke={T.gold} strokeWidth="1.3" /></svg>{a}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CheckoutV2;
