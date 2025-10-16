import React from 'react';
import { Package, Calendar, TrendingUp, ShoppingBag, Clock, CheckCircle, XCircle } from 'lucide-react';
import LuxuryNavigationWhite from '../components/LuxuryNavigationWhite';
import { FooterSection } from '../components/FooterSection';
import { useUserAuth } from '../contexts/UserAuthContext';
import { Link } from 'react-router-dom';

const Orders: React.FC = () => {
  const { user, isAuthenticated } = useUserAuth();

  if (!isAuthenticated || !user) {
    return (
      <>
        <LuxuryNavigationWhite />
        <div className="min-h-screen bg-gray-50 pt-48">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-3xl font-light text-gray-900 mb-4">Please sign in to view your orders</h1>
            <p className="text-gray-600 font-light mb-8">Sign in to access your order history and track your purchases.</p>
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

  // TODO: Fetch orders from API when order system is implemented
  const orders: any[] = [];

  return (
    <>
      <LuxuryNavigationWhite />
      <div className="min-h-screen bg-gray-50 pt-48">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-light text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600 font-light">View and track your order history</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-light text-gray-600">Total Orders</span>
                <Package className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-light text-gray-900">0</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-light text-gray-600">Total Spent</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-light text-gray-900">£0.00</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-light text-gray-600">Pending Orders</span>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-3xl font-light text-gray-900">0</div>
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-lg shadow-sm">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-light text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 font-light mb-6">
                  When you place an order, it will appear here.
                </p>
                <Link
                  to="/"
                  className="inline-block bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors font-light"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          Order #{order.orderNumber}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 font-light">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(order.createdAt).toLocaleDateString('en-GB')}</span>
                          </div>
                          <span>•</span>
                          <span>{order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-light text-gray-900 mb-2">
                          £{order.total.toFixed(2)}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : order.status === 'processing'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {order.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {order.status === 'pending' && <Clock className="w-3 h-3" />}
                          {order.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="space-y-2 mb-4">
                      {order.items.slice(0, 2).map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 text-sm">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <span className="font-light text-gray-700">{item.name}</span>
                          <span className="text-gray-500">×{item.quantity}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-500 font-light">
                          +{order.items.length - 2} more {order.items.length - 2 === 1 ? 'item' : 'items'}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-sm text-gray-700 hover:text-gray-900 font-light underline"
                      >
                        View Details
                      </Link>
                      {order.status === 'completed' && (
                        <button className="text-sm text-amber-700 hover:text-amber-900 font-light underline">
                          Reorder
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <FooterSection />
    </>
  );
};

export default Orders;
