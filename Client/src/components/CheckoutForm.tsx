import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CheckoutFormProps {
  totalAmount: number;
  cartItems: any[];
  onPaymentComplete?: (orderId: string) => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  totalAmount,
  cartItems,
  onPaymentComplete
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'customer' | 'shipping' | 'payment'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const apiUrl = import.meta.env.VITE_API_URL;

  // Form state
  const [formData, setFormData] = useState({
    // Customer
    customerEmail: '',
    customerName: '',
    // Shipping
    shippingAddress: '',
    shippingCity: '',
    shippingPostcode: '',
    shippingCountry: 'United Kingdom',
    // Card
    cardHolder: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateCustomer = () => {
    if (!formData.customerEmail || !formData.customerName) {
      setError('Please fill in all customer details');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validateShipping = () => {
    if (!formData.shippingAddress || !formData.shippingCity || !formData.shippingPostcode) {
      setError('Please fill in all shipping details');
      return false;
    }
    return true;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate card data (basic validation - in production use Stripe's validation)
      if (!formData.cardNumber || formData.cardNumber.length < 13) {
        setError('Invalid card number');
        return;
      }

      // For demo purposes, simulate payment
      // In production, this would use Stripe Elements

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful payment
      const mockOrderId = `ORD-${Date.now()}`;
      setOrderId(mockOrderId);
      setSuccess(true);

      if (onPaymentComplete) {
        onPaymentComplete(mockOrderId);
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/order-confirmation/${mockOrderId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h2 className="text-2xl font-cormorant font-light mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-4">Order ID: {orderId}</p>
        <p className="text-gray-500 text-sm">Redirecting to order confirmation...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8 flex gap-4">
        {(['customer', 'shipping', 'payment'] as const).map((s, idx) => (
          <div key={s} className="flex-1">
            <div
              className={`h-2 rounded-full mb-2 transition-colors ${
                step === s
                  ? 'bg-gray-900'
                  : ['customer', 'shipping'].includes(s) &&
                    ['customer', 'shipping', 'payment'].indexOf(step) >
                      ['customer', 'shipping', 'payment'].indexOf(s)
                  ? 'bg-gray-900'
                  : 'bg-gray-200'
              }`}
            />
            <p className="text-xs text-gray-600 capitalize">{s}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handlePayment} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Customer Details */}
        {step === 'customer' && (
          <div className="space-y-4">
            <h3 className="text-lg font-cormorant">Your Details</h3>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
                placeholder="john@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (validateCustomer()) {
                  setStep('shipping');
                  setError('');
                }
              }}
              className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Continue to Shipping
            </button>
          </div>
        )}

        {/* Shipping Details */}
        {step === 'shipping' && (
          <div className="space-y-4">
            <h3 className="text-lg font-cormorant">Shipping Address</h3>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                placeholder="123 Main Street"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="shippingCity"
                  value={formData.shippingCity}
                  onChange={handleInputChange}
                  placeholder="London"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Postcode *
                </label>
                <input
                  type="text"
                  name="shippingPostcode"
                  value={formData.shippingPostcode}
                  onChange={handleInputChange}
                  placeholder="SW1A 1AA"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('customer')}
                className="flex-1 border border-gray-300 text-gray-900 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateShipping()) {
                    setStep('payment');
                    setError('');
                  }
                }}
                className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Payment Details */}
        {step === 'payment' && (
          <div className="space-y-4">
            <h3 className="text-lg font-cormorant">Payment Details</h3>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                🔒 Your payment information is encrypted and secure. We use industry-standard encryption to protect your data.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Cardholder Name *
              </label>
              <input
                type="text"
                name="cardHolder"
                value={formData.cardHolder}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Card Number *
              </label>
              <input
                type="text"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '').slice(0, 16);
                  const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                  setFormData(prev => ({ ...prev, cardNumber: formatted }));
                }}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Expiry Date *
                </label>
                <input
                  type="text"
                  name="expiry"
                  value={formData.expiry}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + '/' + value.slice(2, 4);
                    }
                    setFormData(prev => ({ ...prev, expiry: value }));
                  }}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  CVC *
                </label>
                <input
                  type="text"
                  name="cvc"
                  value={formData.cvc}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                    setFormData(prev => ({ ...prev, cvc: value }));
                  }}
                  placeholder="123"
                  maxLength={3}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Test Card Info */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                🧪 <strong>Test Mode:</strong> Use <code className="bg-blue-100 px-1">4242 4242 4242 4242</code>, any future expiry date, any 3-digit CVC
              </p>
            </div>

            {/* Order Summary */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{cartItems.length} items</span>
                  <span>£{(totalAmount * 0.9).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 pb-2 border-b border-gray-200">
                  <span>Shipping</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between font-medium text-gray-900">
                  <span>Total</span>
                  <span>£{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="flex-1 border border-gray-300 text-gray-900 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay £${totalAmount.toFixed(2)}`
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Security Badges */}
      <div className="mt-8 flex justify-center gap-4 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">🔒</p>
          <p className="text-xs text-gray-600">Secure Payment</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">💳</p>
          <p className="text-xs text-gray-600">PCI Compliant</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">✓</p>
          <p className="text-xs text-gray-600">256-bit SSL</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
