import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Package, Calendar, MapPin, DollarSign, Truck } from 'lucide-react';
import LuxuryNavigationWhite from '../components/LuxuryNavigationWhite';
import { FooterSection } from '../components/FooterSection';
import { useUserAuth } from '../contexts/UserAuthContext';
import { api } from '../config/api';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product_type?: string;
  attributes?: {
    metal?: string;
    size?: string;
    brand?: string;
    variant_name?: string;
    stoneType?: string;
    carat?: string;
    clarity?: string;
    colour?: string;
    cut?: string;
    [key: string]: any;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: string;
  total: number;
  createdAt: string;
  itemsCount: number;
  items: OrderItem[];
  shippingAddress?: any;
  trackingNumber?: string;
}

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUserAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user && orderId) {
      fetchOrderDetail();
    }
  }, [isAuthenticated, user, orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('user_access_token');

      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const response = await fetch(api(`/users/orders`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();

      if (data.success && data.data && data.data.orders) {
        const foundOrder = data.data.orders.find((o: Order) => o.id === orderId);
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('Order not found');
        }
      } else {
        setError('Failed to load order details');
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <>
        <LuxuryNavigationWhite />
        <div className="min-h-screen bg-gray-50 pt-48">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-light text-gray-900 mb-4">Please sign in to view order details</h1>
            <Link
              to="/account"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
        <FooterSection />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <LuxuryNavigationWhite />
        <div className="min-h-screen bg-gray-50 pt-48">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
              <p className="text-gray-600 font-light">Loading order details...</p>
            </div>
          </div>
        </div>
        <FooterSection />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <LuxuryNavigationWhite />
        <div className="min-h-screen bg-gray-50 pt-48">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <button
              onClick={() => navigate('/orders')}
              className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-8 font-light"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </button>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700 font-light">{error || 'Order not found'}</p>
            </div>
          </div>
        </div>
        <FooterSection />
      </>
    );
  }

  const statusColors: Record<string, string> = {
    'delivered': 'bg-green-100 text-green-700',
    'processing': 'bg-blue-100 text-blue-700',
    'pending': 'bg-amber-100 text-amber-700',
    'shipped': 'bg-purple-100 text-purple-700',
    'cancelled': 'bg-red-100 text-red-700'
  };

  const statusMessages: Record<string, string> = {
    'pending': 'Your order is being prepared for shipment',
    'processing': 'Your order is being processed',
    'shipped': 'Your order is on its way!',
    'delivered': 'Your order has been delivered',
    'cancelled': 'This order has been cancelled'
  };

  return (
    <>
      <LuxuryNavigationWhite />
      <div className="min-h-screen bg-gray-50 pt-48">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-8 font-light"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>

          {/* Order Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-light text-gray-900 mb-2">
                  Order #{order.orderNumber}
                </h1>
                <p className="text-gray-600 font-light">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  statusColors[order.status] || 'bg-gray-100 text-gray-700'
                }`}
              >
                <span className="w-2 h-2 bg-current rounded-full"></span>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            {/* Status Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800 font-light">
                {statusMessages[order.status]}
              </p>
            </div>
          </div>

          {/* Order Summary Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-xl font-light text-gray-900 mb-6">Order Items</h2>
              <div className="space-y-6">
                {order.items.map((item) => {
                  // Format product attributes for display
                  const renderAttributes = () => {
                    const attributes = item.attributes || {};
                    const attrLines = [];

                    // Handle watches
                    if (item.product_type === 'watch') {
                      if (attributes.brand) attrLines.push(`Brand: ${attributes.brand}`);
                      if (attributes.variant_name) attrLines.push(`Variant: ${attributes.variant_name}`);
                    }

                    // Handle jewelry
                    if (item.product_type === 'jewelry' || !item.product_type) {
                      if (attributes.metal) attrLines.push(`Metal: ${attributes.metal}`);
                      if (attributes.size) attrLines.push(`Size: ${attributes.size}`);
                    }

                    // Handle Nivoda stone options
                    if (attributes.stoneType) {
                      attrLines.push(`Stone Type: ${attributes.stoneType}`);
                      if (attributes.carat) attrLines.push(`Carat: ${attributes.carat}`);
                      if (attributes.clarity) attrLines.push(`Clarity: ${attributes.clarity}`);
                      if (attributes.colour) attrLines.push(`Colour: ${attributes.colour}`);
                      if (attributes.cut) attrLines.push(`Cut: ${attributes.cut}`);
                    }

                    return attrLines;
                  };

                  const attributeLines = renderAttributes();

                  return (
                    <div key={item.id} className="pb-4 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                          {item.product_type && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mb-2 mr-2">
                              {item.product_type}
                            </span>
                          )}
                          <p className="text-sm text-gray-600 font-light">
                            Quantity: {item.quantity} × £{item.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium text-gray-900">
                            £{item.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {/* Product Attributes */}
                      {attributeLines.length > 0 && (
                        <div className="mt-3 space-y-1 text-xs text-gray-700 bg-white p-2 rounded border border-gray-200 ml-0">
                          {attributeLines.map((line, idx) => (
                            <div key={idx}>{line}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              {/* Total Amount */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-xl font-light text-gray-900 mb-6">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-light">Subtotal</span>
                    <span className="text-gray-900">£{order.total.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="text-xl font-light text-gray-900">£{order.total.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 font-light mb-2">Payment Status:</p>
                    <p className="font-medium text-green-700">
                      {order.paymentStatus === 'paid' ? '✓ Paid' : order.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tracking Info */}
              {order.trackingNumber && (
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Truck className="w-5 h-5 text-amber-600" />
                    <h3 className="font-medium text-gray-900">Tracking Information</h3>
                  </div>
                  <p className="text-gray-600 font-light text-sm mb-2">Tracking Number:</p>
                  <p className="font-mono text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                    {order.trackingNumber}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-light text-gray-900">Shipping Address</h2>
              </div>
              <div className="text-gray-700 font-light space-y-1">
                {order.shippingAddress.name && (
                  <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
                )}
                {order.shippingAddress.address && (
                  <p>{order.shippingAddress.address}</p>
                )}
                {order.shippingAddress.city && order.shippingAddress.postalCode && (
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                  </p>
                )}
                {order.shippingAddress.country && (
                  <p>{order.shippingAddress.country}</p>
                )}
                {order.shippingAddress.phone && (
                  <p className="pt-2 text-sm">{order.shippingAddress.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-8">
            <h3 className="font-medium text-amber-900 mb-2">Need Help?</h3>
            <p className="text-sm text-amber-800 font-light mb-4">
              If you have any questions about your order, please contact our customer service team.
            </p>
            <Link
              to="/customer-service"
              className="text-amber-700 hover:text-amber-900 text-sm font-light underline"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
      <FooterSection />
    </>
  );
};

export default OrderDetail;
