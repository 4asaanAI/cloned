import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Package, Plus, X, Edit, Loader2, TrendingDown, AlertTriangle, CheckCircle, Archive, ShoppingCart } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface InventoryItem {
  id: string;
  category_id?: string;
  item_name: string;
  item_code: string;
  description?: string;
  unit: string;
  quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  unit_price: number;
  supplier_name?: string;
  supplier_contact?: string;
  location?: string;
  condition: string;
  status: string;
  purchase_date?: string;
  warranty_expiry?: string;
  last_maintenance?: string;
  category?: { name: string };
}

interface Transaction {
  id: string;
  item_id: string;
  transaction_type: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  issued_to?: string;
  issued_by?: string;
  reason?: string;
  remarks?: string;
  transaction_date: string;
  item?: { item_name: string; item_code: string };
  issued_to_profile?: { full_name: string };
  issued_by_profile?: { full_name: string };
}

export function InventoryPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'low_stock' | 'out_of_stock'>('all');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [itemForm, setItemForm] = useState({
    category_id: '', item_name: '', item_code: '', description: '', unit: 'piece',
    quantity: 0, min_stock_level: 10, max_stock_level: 100, unit_price: 0,
    supplier_name: '', supplier_contact: '', location: '', condition: 'good',
    purchase_date: '', warranty_expiry: '', last_maintenance: ''
  });

  const [transactionForm, setTransactionForm] = useState({
    item_id: '', transaction_type: 'purchase', quantity: 0, unit_price: 0,
    issued_to: '', reason: '', remarks: ''
  });

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const isAdmin = profile?.role === 'admin' || profile?.sub_role === 'head' || profile?.sub_role === 'principal';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, categoriesRes, transactionsRes] = await Promise.all([
        supabase.from('inventory_items').select('*, category:inventory_categories(name)').order('item_name'),
        supabase.from('inventory_categories').select('*').order('name'),
        supabase.from('inventory_transactions').select('*, item:inventory_items(item_name, item_code), issued_to_profile:profiles!inventory_transactions_issued_to_fkey(full_name), issued_by_profile:profiles!inventory_transactions_issued_by_fkey(full_name)').order('created_at', { ascending: false }).limit(50)
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      setItems(itemsRes.data || []);
      setCategories(categoriesRes.data || []);
      setTransactions(transactionsRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...itemForm, category_id: itemForm.category_id || null };
      if (editingItem) {
        const { error } = await supabase.from('inventory_items').update(data).eq('id', editingItem.id);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Item updated successfully' });
      } else {
        const { error } = await supabase.from('inventory_items').insert(data);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Item added successfully' });
      }
      setShowItemModal(false);
      setItemForm({
        category_id: '', item_name: '', item_code: '', description: '', unit: 'piece',
        quantity: 0, min_stock_level: 10, max_stock_level: 100, unit_price: 0,
        supplier_name: '', supplier_contact: '', location: '', condition: 'good',
        purchase_date: '', warranty_expiry: '', last_maintenance: ''
      });
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const total = transactionForm.quantity * transactionForm.unit_price;
      const data = {
        ...transactionForm,
        total_amount: total,
        issued_by: profile?.id,
        issued_to: transactionForm.issued_to || null,
        transaction_date: new Date().toISOString().split('T')[0]
      };
      const { error } = await supabase.from('inventory_transactions').insert(data);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Transaction recorded successfully' });
      setShowTransactionModal(false);
      setTransactionForm({ item_id: '', transaction_type: 'purchase', quantity: 0, unit_price: 0, issued_to: '', reason: '', remarks: '' });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('inventory_categories').insert(categoryForm);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Category added successfully' });
      setShowCategoryModal(false);
      setCategoryForm({ name: '', description: '' });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.status === selectedFilter;
  });

  const stats = {
    total: items.length,
    available: items.filter(i => i.status === 'available').length,
    low_stock: items.filter(i => i.status === 'low_stock').length,
    out_of_stock: items.filter(i => i.status === 'out_of_stock').length,
    total_value: items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowCategoryModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm">
                <Archive className="h-4 w-4" />
                Add Category
              </button>
              <button onClick={() => { setShowItemModal(true); setEditingItem(null); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                <Plus className="h-4 w-4" />
                Add Item
              </button>
              <button onClick={() => setShowTransactionModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                <ShoppingCart className="h-4 w-4" />
                Record Transaction
              </button>
            </div>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <Package className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.available}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.low_stock}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.out_of_stock}</p>
              </div>
              <TrendingDown className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">${stats.total_value.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['all', 'available', 'low_stock', 'out_of_stock'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filter.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  {isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      No items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{item.item_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{item.item_code}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{item.category?.name || 'N/A'}</td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{item.quantity} {item.unit}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Min: {item.min_stock_level}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">${item.unit_price}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{item.location || 'N/A'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          item.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-4">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setItemForm({
                                category_id: item.category_id || '',
                                item_name: item.item_name,
                                item_code: item.item_code,
                                description: item.description || '',
                                unit: item.unit,
                                quantity: item.quantity,
                                min_stock_level: item.min_stock_level,
                                max_stock_level: item.max_stock_level,
                                unit_price: item.unit_price,
                                supplier_name: item.supplier_name || '',
                                supplier_contact: item.supplier_contact || '',
                                location: item.location || '',
                                condition: item.condition,
                                purchase_date: item.purchase_date || '',
                                warranty_expiry: item.warranty_expiry || '',
                                last_maintenance: item.last_maintenance || ''
                              });
                              setShowItemModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Issued By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map(txn => (
                  <tr key={txn.id}>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{new Date(txn.transaction_date).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{txn.item?.item_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{txn.item?.item_code}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        txn.transaction_type === 'purchase' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        txn.transaction_type === 'issue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {txn.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{txn.quantity}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">${txn.total_amount}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{txn.issued_by_profile?.full_name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingItem ? 'Edit Item' : 'Add Item'}</h2>
              <button onClick={() => setShowItemModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleItemSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item Name *</label>
                  <input type="text" value={itemForm.item_name} onChange={e => setItemForm({ ...itemForm, item_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item Code *</label>
                  <input type="text" value={itemForm.item_code} onChange={e => setItemForm({ ...itemForm, item_code: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select value={itemForm.category_id} onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">Select category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit</label>
                  <select value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="piece">Piece</option>
                    <option value="box">Box</option>
                    <option value="kg">Kilogram</option>
                    <option value="liter">Liter</option>
                    <option value="meter">Meter</option>
                    <option value="set">Set</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                  <input type="number" value={itemForm.quantity} onChange={e => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit Price</label>
                  <input type="number" step="0.01" value={itemForm.unit_price} onChange={e => setItemForm({ ...itemForm, unit_price: parseFloat(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Stock Level</label>
                  <input type="number" value={itemForm.min_stock_level} onChange={e => setItemForm({ ...itemForm, min_stock_level: parseInt(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Stock Level</label>
                  <input type="number" value={itemForm.max_stock_level} onChange={e => setItemForm({ ...itemForm, max_stock_level: parseInt(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                  <input type="text" value={itemForm.location} onChange={e => setItemForm({ ...itemForm, location: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Condition</label>
                  <select value={itemForm.condition} onChange={e => setItemForm({ ...itemForm, condition: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supplier Name</label>
                  <input type="text" value={itemForm.supplier_name} onChange={e => setItemForm({ ...itemForm, supplier_name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supplier Contact</label>
                  <input type="text" value={itemForm.supplier_contact} onChange={e => setItemForm({ ...itemForm, supplier_contact: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Purchase Date</label>
                  <input type="date" value={itemForm.purchase_date} onChange={e => setItemForm({ ...itemForm, purchase_date: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Warranty Expiry</label>
                  <input type="date" value={itemForm.warranty_expiry} onChange={e => setItemForm({ ...itemForm, warranty_expiry: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Maintenance</label>
                  <input type="date" value={itemForm.last_maintenance} onChange={e => setItemForm({ ...itemForm, last_maintenance: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Record Transaction</h2>
              <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item *</label>
                <select value={transactionForm.item_id} onChange={e => setTransactionForm({ ...transactionForm, item_id: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                  <option value="">Select item</option>
                  {items.map(item => <option key={item.id} value={item.id}>{item.item_name} ({item.item_code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction Type *</label>
                <select value={transactionForm.transaction_type} onChange={e => setTransactionForm({ ...transactionForm, transaction_type: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                  <option value="purchase">Purchase</option>
                  <option value="issue">Issue</option>
                  <option value="return">Return</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="damage">Damage</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity *</label>
                  <input type="number" value={transactionForm.quantity} onChange={e => setTransactionForm({ ...transactionForm, quantity: parseInt(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Unit Price</label>
                  <input type="number" step="0.01" value={transactionForm.unit_price} onChange={e => setTransactionForm({ ...transactionForm, unit_price: parseFloat(e.target.value) })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason</label>
                <input type="text" value={transactionForm.reason} onChange={e => setTransactionForm({ ...transactionForm, reason: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remarks</label>
                <textarea value={transactionForm.remarks} onChange={e => setTransactionForm({ ...transactionForm, remarks: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowTransactionModal(false)} className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg flex items-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Recording...' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Category</h2>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category Name *</label>
                <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg flex items-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
