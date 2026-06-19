"use client";

import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";
import OptimizedImage from "../../components/OptimizedImage";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Trash2, Lock, ArrowRight, ShieldCheck, ShoppingCart } from "lucide-react";
import { API_URL, API_BASE_URL } from "../../services/api";

export default function CartPage() {
  const { cartItems, removeFromCart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const shippingTotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.shipping_fee || "0")), 0);
  const orderTotal = cartTotal + shippingTotal;

  const handleCheckout = async () => {
    if (!user) {
      router.push("/login?redirect=/cart");
      return;
    }

    if (!user.address) {
      router.push("/profile");
      return;
    }

    setIsProcessing(true);
    let successCount = 0;

    for (const item of cartItems) {
      try {
        const res = await fetch(`${API_URL}/orders/buy-now`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            product_id: parseInt(item.id),
            buyer_id: user.id
          })
        });

        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error("Failed to secure deal for item", item.id, err);
      }
    }

    clearCart();
    setIsProcessing(false);
    
    // Redirect to profile buying tab to complete payments
    alert(`Successfully secured ${successCount} items! Redirecting to your Dashboard to complete secure Escrow payments.`);
    router.push("/profile?tab=buying");
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shopping Cart' }]} />
        
        <h1 className="section-title text-3xl mb-8 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-gold" />
          Your Cart
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-border">
            <ShoppingCart className="w-16 h-16 text-muted mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-serif text-foreground mb-2">Your cart is empty</h2>
            <p className="text-sm text-muted mb-6">Discover extraordinary timepieces to add to your collection.</p>
            <button 
              onClick={() => router.push("/")}
              className="gold-sweep px-8 py-3 text-xs font-black uppercase tracking-widest"
            >
              Explore Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-surface border border-border p-4 flex gap-6 items-center">
                  <div className="w-24 h-24 bg-background border border-border relative overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => router.push(`/products/${item.id}`)}>
                    <OptimizedImage
                      src={item.image_url.startsWith('http') ? item.image_url : `${API_BASE_URL}/uploads/${item.image_url}`}
                      alt={item.title}
                      fill
                      className="object-contain p-2 hover:scale-110 transition-transform duration-500"
                      size="small"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">{item.condition_code}</p>
                    <h3 className="font-serif text-lg text-foreground cursor-pointer hover:text-gold transition-colors" onClick={() => router.push(`/products/${item.id}`)}>{item.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="font-bold text-foreground">₹{parseFloat(item.price).toLocaleString()}</span>
                      <span className="text-xs text-muted">
                        {item.shipping_type === 'free' ? 'Free Shipping' : `+ ₹${parseFloat(item.shipping_fee || "0").toLocaleString()} Shipping`}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-3 text-muted hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-surface border border-border p-6 sticky top-28 card-glow">
                <h3 className="font-bold text-foreground text-sm mb-6 pb-4 border-b border-border">Order Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted uppercase tracking-widest font-bold">Subtotal ({cartItems.length} items)</span>
                    <span className="text-sm font-bold text-foreground">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted uppercase tracking-widest font-bold">Shipping</span>
                    <span className="text-sm font-bold text-foreground">{shippingTotal > 0 ? `₹${shippingTotal.toLocaleString()}` : 'FREE'}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-border flex justify-between items-end">
                    <span className="text-xs text-muted uppercase tracking-widest font-black">Total Due</span>
                    <span className="price-serif text-2xl">₹{orderTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {!user ? (
                    <button 
                      onClick={() => router.push("/login?redirect=/cart")}
                      className="w-full bg-primary text-white border border-primary hover:bg-transparent hover:text-primary transition-colors py-4 text-xs font-black uppercase tracking-[0.2em]"
                    >
                      Sign In to Checkout
                    </button>
                  ) : !user.address ? (
                    <button 
                      onClick={() => router.push("/profile")}
                      className="w-full bg-rose-600 text-white border border-rose-600 hover:bg-rose-700 transition-colors py-4 text-xs font-black uppercase tracking-[0.2em]"
                    >
                      Add Shipping Address
                    </button>
                  ) : (
                    <button 
                      onClick={handleCheckout}
                      disabled={isProcessing}
                      className="gold-sweep w-full py-4 text-sm font-black uppercase tracking-widest flex justify-center items-center gap-2"
                    >
                      {isProcessing ? (
                         <>
                           <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                             <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                             <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                           </svg>
                           Securing Assets...
                         </>
                      ) : (
                         <>
                           Secure Checkout <ArrowRight className="w-4 h-4" />
                         </>
                      )}
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted justify-center mt-4 border border-gold/20 bg-gold/[0.02] p-3">
                    <ShieldCheck className="w-4 h-4 text-gold" />
                    <span>Funds held in secure Escrow until delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
