import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Eye,
  ChevronDown,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import API_BASE_URL from '../../config/api';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_type?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  total_amount: number;
  currency: string;
  shipping_address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetail extends Order {
  items: OrderItem[];
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'watch' | 'jewelry'>('all');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const itemsPerPage = 10;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, paymentFilter, productTypeFilter, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/payments/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders || []);
      } else {
        setError(data.message || 'Failed to fetch orders');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setDetailsLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/payments/order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setSelectedOrder(data.data);
      } else {
        setError(data.message || 'Failed to fetch order details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/payments/order/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus as any });
        }
      } else {
        setError(data.message || 'Failed to update order status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update order status');
    }
  };

  const filterOrders = () => {
    let filtered = orders.filter(order => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;

      // Filter by product type: check if any items in the order match the selected type
      let matchesProductType = true;
      if (productTypeFilter !== 'all' && order.items) {
        matchesProductType = order.items.some(item => item.product_type === productTypeFilter);
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesProductType;
    });

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <Package className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  if (loading) return <AdminLayout><LoadingSpinner /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Orders Management
          </h1>
          <p className="text-gray-600 mt-1">Manage and track customer orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order #, customer name, or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value as any);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Payment Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Product Type Filter */}
            <div>
              <select
                value={productTypeFilter}
                onChange={(e) => {
                  setProductTypeFilter(e.target.value as any);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Products</option>
                <option value="watch">Watch Orders</option>
                <option value="jewelry">Jewelry Orders</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {paginatedOrders.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order #</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Payment</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <span className="font-mono text-blue-600">{order.order_number}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        £{order.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group">
                          <button
                            onClick={() => setOpenStatusDropdown(openStatusDropdown === order.id ? null : order.id)}
                            disabled={updatingOrderId === order.id}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium cursor-pointer hover:shadow-md transition-all ${getStatusColor(order.status)} ${updatingOrderId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {/* Dropdown Menu */}
                          {openStatusDropdown === order.id && updatingOrderId !== order.id && (
                            <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                              {validStatuses.map(status => (
                                <button
                                  key={status}
                                  onClick={async () => {
                                    setUpdatingOrderId(order.id);
                                    await updateOrderStatus(order.id, status);
                                    setUpdatingOrderId(null);
                                    setOpenStatusDropdown(null);
                                  }}
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center gap-2 ${
                                    order.status === status ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700'
                                  }`}
                                >
                                  {getStatusIcon(status)}
                                  <span className="capitalize">{status}</span>
                                  {order.status === status && <span className="ml-auto text-blue-600">✓</span>}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${getPaymentColor(order.payment_status)}`}>
                          <span className="capitalize">{order.payment_status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => fetchOrderDetails(order.id)}
                          className="text-blue-600 hover:text-blue-900 font-medium flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {detailsLoading ? (
                <LoadingSpinner />
              ) : (
                <>
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-6">
                    {/* Order Header */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Order Number</h3>
                        <p className="text-2xl font-mono font-bold text-blue-600">{selectedOrder.order_number}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Order Date</h3>
                        <p className="text-lg font-medium text-gray-900">
                          {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Customer Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm text-gray-600">Customer Name</div>
                            <div className="font-medium text-gray-900">{selectedOrder.customer_name}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm text-gray-600">Email</div>
                            <div className="font-medium text-gray-900">{selectedOrder.customer_email}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Shipping Address</h3>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="text-gray-900">
                          {(() => {
                            try {
                              const addr = JSON.parse(selectedOrder.shipping_address);
                              return (
                                <>
                                  <p>{addr.street}</p>
                                  {addr.apartment && <p>{addr.apartment}</p>}
                                  <p>{addr.city}, {addr.postalCode}</p>
                                  <p>{addr.country}</p>
                                </>
                              );
                            } catch {
                              return <p>{selectedOrder.shipping_address}</p>;
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Order Items</h3>
                      <div className="space-y-4">
                        {selectedOrder.items?.map((item) => {
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
                            <div key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 mb-1">{item.product_name}</div>
                                  <div className="text-sm text-gray-600 mb-2">
                                    Qty: {item.quantity}
                                    {item.product_type && (
                                      <span className="ml-3 inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                        {item.product_type}
                                      </span>
                                    )}
                                  </div>
                                  {/* Product Options/Attributes */}
                                  {attributeLines.length > 0 && (
                                    <div className="mt-2 space-y-1 text-xs text-gray-700 bg-white p-2 rounded border border-gray-200">
                                      {attributeLines.map((line, idx) => (
                                        <div key={idx}>{line}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <div className="font-medium text-gray-900">
                                    £{item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    £{item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })} each
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          £{selectedOrder.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Status Update */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Update Status</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                          <select
                            value={selectedOrder.status}
                            onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
