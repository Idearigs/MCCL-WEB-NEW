import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  cartItems: any[];
  customerEmail: string;
  customerName: string;
  shippingAddress: any;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

declare global {
  interface Window {
    Stripe: any;
  }
}

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  cartItems,
  customerEmail,
  customerName,
  shippingAddress,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const apiUrl = import.meta.env.VITE_API_URL;
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  // Load Stripe
  useEffect(() => {
    if (!stripeKey) {
      setErrorMessage('Stripe configuration missing');
      return;
    }

    // Load Stripe JS
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => {
      const stripeInstance = (window as any).Stripe(stripeKey);
      setStripe(stripeInstance);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [stripeKey]);

  // Create payment intent
  useEffect(() => {
    if (!stripe || !cartItems.length) return;

    const createIntent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/payments/create-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency: 'gbp',
            description: `Order from McCulloch - ${cartItems.length} items`,
            cartItems,
            customerId: customerEmail
          })
        });

        const data = await response.json();
        if (data.success) {
          setPaymentIntent(data.data);
        } else {
          setErrorMessage(data.message || 'Failed to create payment intent');
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Payment setup failed');
      } finally {
        setLoading(false);
      }
    };

    createIntent();
  }, [stripe, amount, cartItems, apiUrl]);

  // Initialize card element
  useEffect(() => {
    if (!stripe || !paymentIntent) return;

    const elements = stripe.elements({ clientSecret: paymentIntent.clientSecret });
    const cardEl = elements.create('card');
    cardEl.mount('#card-element');
    setCardElement(cardEl);

    return () => {
      cardEl.unmount();
    };
  }, [stripe, paymentIntent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !cardElement || !paymentIntent) {
      setErrorMessage('Payment system not ready');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent: confirmedPI } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerName,
              email: customerEmail
            }
          }
        }
      );

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
        return;
      }

      if (confirmedPI.status === 'succeeded') {
        // Confirm payment on backend and create order
        const confirmResponse = await fetch(`${apiUrl}/payments/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: confirmedPI.id,
            customerEmail,
            customerName,
            shippingAddress,
            cartItems
          })
        });

        const confirmData = await confirmResponse.json();
        if (confirmData.success) {
          onSuccess(confirmData.data);
        } else {
          setErrorMessage(confirmData.message || 'Order creation failed');
          onError(confirmData.message || 'Order creation failed');
        }
      } else if (confirmedPI.status === 'requires_action') {
        setErrorMessage('Additional authentication required. Please complete 3D Secure verification.');
        onError('3D Secure verification required');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Payment processing failed';
      setErrorMessage(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Card Element */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Card Details
        </label>
        <div
          id="card-element"
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Order Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Subtotal</span>
          <span className="text-sm text-gray-900">£{(amount * 0.9).toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
          <span className="text-sm text-gray-600">Tax</span>
          <span className="text-sm text-gray-900">£{(amount * 0.1).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-900">Total</span>
          <span className="font-medium text-gray-900">£{amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !stripe || !paymentIntent}
        className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay £${amount.toFixed(2)}`
        )}
      </button>

      {/* Test Card Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          🧪 <strong>Test Mode:</strong> Use card <code className="bg-blue-100 px-1">4242 4242 4242 4242</code>, any future expiry, any 3-digit CVC
        </p>
      </div>
    </form>
  );
};

export default StripePaymentForm;
