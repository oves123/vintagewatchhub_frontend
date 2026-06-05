"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ComparisonContext = createContext();

export function ComparisonProvider({ children }) {
  const [comparedProducts, setComparedProducts] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("compare_list");
    if (saved) {
      try {
        setComparedProducts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load comparison list", e);
      }
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem("compare_list", JSON.stringify(comparedProducts));
  }, [comparedProducts]);

  const addToCompare = (product) => {
    if (comparedProducts.find((p) => p.id === product.id)) return;
    if (comparedProducts.length >= 4) {
      alert("You can compare up to 4 watches at a time.");
      return;
    }
    setComparedProducts([...comparedProducts, product]);
  };

  const removeFromCompare = (productId) => {
    setComparedProducts(comparedProducts.filter((p) => p.id !== productId));
  };

  const clearCompare = () => {
    setComparedProducts([]);
  };

  const toggleCompare = (product) => {
    if (comparedProducts.find((p) => p.id === product.id)) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  return (
    <ComparisonContext.Provider
      value={{
        comparedProducts,
        addToCompare,
        removeFromCompare,
        clearCompare,
        toggleCompare,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}
