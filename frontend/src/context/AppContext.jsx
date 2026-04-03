import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/apiClient";
import { AppContext } from "./appContextObject.jsx";

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("umang_token");

  const fetchProducts = useCallback(async (params = {}) => {
    const { data } = await api.get("/products", { params });
    setProducts(data);
    return data;
  }, []);

  const fetchMe = useCallback(async () => {
    if (!token) return null;

    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      return data;
    } catch {
      localStorage.removeItem("umang_token");
      setUser(null);
      return null;
    }
  }, [token]);

  const fetchCart = useCallback(async () => {
    if (!localStorage.getItem("umang_token")) {
      setCart({ items: [] });
      return;
    }

    try {
      const { data } = await api.get("/cart");
      setCart(data || { items: [] });
    } catch {
      setCart({ items: [] });
    }
  }, []);

  const login = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", payload);
      localStorage.setItem("umang_token", data.token);
      setUser(data);
      await fetchCart();
      toast.success("Welcome back to Umang");
      return data;
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", payload);
      localStorage.setItem("umang_token", data.token);
      setUser(data);
      await fetchCart();
      toast.success("Account created successfully");
      return data;
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem("umang_token")) {
        await api.post("/auth/logout");
      }
    } catch {
      // Ignore logout sync failures and clear local state anyway.
    } finally {
      localStorage.removeItem("umang_token");
      setUser(null);
      setCart({ items: [] });
      toast.success("Logged out");
    }
  }, []);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    const { data } = await api.post("/cart", { productId, quantity });
    setCart(data);
    toast.success("Added to cart");
  }, []);

  const updateCartQty = useCallback(async (productId, quantity) => {
    const { data } = await api.put(`/cart/${productId}`, { quantity });
    setCart(data);
  }, []);

  const removeCartItem = useCallback(async (productId) => {
    const { data } = await api.delete(`/cart/${productId}`);
    setCart(data);
    toast.success("Item removed");
  }, []);

  const cartCount = useMemo(
    () => cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
    [cart.items]
  );

  useEffect(() => {
    void fetchProducts();
    void fetchMe();
    void fetchCart();
  }, [fetchProducts, fetchMe, fetchCart]);

  const value = {
    user,
    products,
    cart,
    loading,
    cartCount,
    setUser,
    setProducts,
    fetchProducts,
    fetchMe,
    fetchCart,
    login,
    register,
    logout,
    addToCart,
    updateCartQty,
    removeCartItem
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
