"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "./ToastContext";

export type CartItem = {
  id: string;
  title: string;
  price: string;
  shipping_fee: string;
  shipping_type: string;
  condition_code: string;
  image_url: string;
  seller_id: string;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  cartTotal: number;
  cartShipping: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("vintage_watch_cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (e) {
      console.error("Failed to load cart from local storage", e);
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("vintage_watch_cart", JSON.stringify(items));
  };

  const addToCart = (item: CartItem) => {
    if (cartItems.some((i) => i.id === item.id)) {
      addToast("Item is already in your cart");
      return;
    }
    const newCart = [...cartItems, item];
    saveCart(newCart);
    addToast("Added to cart successfully");
  };

  const removeFromCart = (id: string) => {
    const newCart = cartItems.filter((i) => i.id !== id);
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const isInCart = (id: string) => {
    return cartItems.some((i) => i.id === id);
  };

  const cartTotal = cartItems.reduce((total, item) => total + parseFloat(item.price || "0"), 0);
  const cartShipping = cartItems.reduce((total, item) => total + parseFloat(item.shipping_fee || "0"), 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, isInCart, cartTotal, cartShipping }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
