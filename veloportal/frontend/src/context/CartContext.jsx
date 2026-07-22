import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setTotal(0); return; }
    const { data } = await api.get('/cart');
    setItems(data.items);
    setTotal(data.total);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addToCart = async (bicycleId, quantity = 1) => {
    await api.post('/cart', { bicycleId, quantity });
    await refresh();
  };
  const updateQty = async (id, quantity) => { await api.put(`/cart/${id}`, { quantity }); await refresh(); };
  const removeItem = async (id) => { await api.delete(`/cart/${id}`); await refresh(); };

  return (
    <CartContext.Provider value={{ items, total, addToCart, updateQty, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
