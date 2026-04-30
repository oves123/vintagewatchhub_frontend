"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck, Clock, CheckCircle, ArrowLeft, ExternalLink, Info } from "lucide-react";
import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function CheckoutPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSecuring, setIsSecuring] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/login?redirect=/products/" + id);
    }

    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_URL}/products/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  const handleConfirmPurchase = async () => {
    setIsSecuring(true);
    try {
      const res = await fetch(`${API_URL}/orders/buy-now`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          product_id: parseInt(id),
          buyer_id: user.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Success!
        alert("Deal Secured! You will now be redirected to your profile to complete the payment.");
        router.push("/profile?tab=buying");
      } else {
        alert(data.message || "Failed to secure deal.");
      }
    } catch (err) {
      alert("Error securing deal. Please try again.");
    } finally {
      setIsSecuring(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center font-black uppercase tracking-[0.3em] text-[10px] text-blue-600 animate-pulse">Authenticating Transaction Node...</div>;
  if (!product) return <div className="min-h-screen bg-white flex items-center justify-center font-black uppercase tracking-[0.3em] text-[10px] text-red-500">Asset Data Missing</div>;

  const itemPrice = parseFloat(product.buy_it_now_price || product.price);
  const shippingFee = product.shipping_type === 'fixed' ? parseFloat(product.shipping_fee || 0) : 0;
  const totalAmount = itemPrice + shippingFee;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a] font-sans pb-20">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-10">
           <button onClick={() => window.close()} className="p-3 bg-white border border-gray-100 rounded-full hover:bg-gray-50 transition shadow-sm">
              <ArrowLeft className="w-5 h-5" />
           </button>
           <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">Confirm Acquisition</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Reviewing transaction details for Asset #D-{id}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Left Column: Summary */}
           <div className="lg:col-span-7 space-y-8">
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 p-8">
                 <div className="flex gap-8">
                    <div className="w-32 h-32 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                       <img 
                         src={product.images?.[0] ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}/uploads/${product.images[0]}`) : '/placeholder.png'} 
                         className="w-full h-full object-cover"
                         alt={product.title}
                       />
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{product.category || 'Luxury Asset'}</p>
                       <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900 leading-tight mb-3">{product.title}</h2>
                       <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-gray-50 rounded-lg text-[9px] font-bold uppercase tracking-widest text-gray-500 border border-gray-100">{product.condition_code || 'Pre-owned'}</span>
                          <span className="px-3 py-1 bg-emerald-50 rounded-lg text-[9px] font-bold uppercase tracking-widest text-emerald-600 border border-emerald-100 flex items-center gap-1">
                             <ShieldCheck className="w-3 h-3" /> Hub Verified
                          </span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40 p-8">
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" /> Fulfillment Destination
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registered Shipping Address</p>
                       <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{user?.address}</p>
                          <p className="text-xs text-gray-500">{user?.city}, {user?.state} - {user?.pincode}</p>
                          <p className="text-xs font-bold text-blue-600 mt-3">{user?.phone}</p>
                       </div>
                    </div>
                    <div className="flex flex-col justify-center">
                       <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                             <Clock className="w-3.5 h-3.5" /> Shipping Guarantee
                          </p>
                          <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                             Once confirmed, the seller is required to ship this item within 48-72 hours. Your funds will be held securely in escrow until you confirm receipt.
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-emerald-600 rounded-[32px] p-8 text-white shadow-xl shadow-emerald-100">
                 <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                       <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold uppercase tracking-tight">Buyer Protection Enabled</h3>
                       <p className="text-[11px] opacity-80 mt-1 font-medium leading-relaxed">
                          This acquisition is fully protected by the Watch Collector Hub escrow system. Sellers only receive payouts after you authenticate the delivery.
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Column: Totals & Action */}
           <div className="lg:col-span-5">
              <div className="bg-white rounded-[32px] border-2 border-black shadow-2xl shadow-gray-200 p-8 sticky top-32">
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8 border-b border-gray-100 pb-4">Transaction Summary</h3>
                 
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Asset Value</p>
                       <p className="text-base font-black text-gray-900">₹{itemPrice.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Shipping Fee</p>
                          <Info className="w-3 h-3 text-gray-300" />
                       </div>
                       <p className="text-base font-bold text-gray-900">{shippingFee > 0 ? `₹${shippingFee.toLocaleString()}` : 'FREE'}</p>
                    </div>
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Hub Authentication</p>
                          <span className="px-2 py-0.5 bg-emerald-50 text-[8px] font-black text-emerald-600 rounded uppercase">Included</span>
                       </div>
                       <p className="text-base font-bold text-emerald-600">₹0</p>
                    </div>

                    <div className="pt-8 border-t border-dashed border-gray-200 mt-8">
                       <div className="flex justify-between items-end mb-8">
                          <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Total Acquisition Cost</p>
                             <p className="text-[8px] font-bold text-gray-400 uppercase mt-1 italic">Exclusive of any local delivery taxes</p>
                          </div>
                          <p className="text-4xl font-black text-gray-950 tracking-tighter">₹{totalAmount.toLocaleString()}</p>
                       </div>

                       <button 
                         onClick={handleConfirmPurchase}
                         disabled={isSecuring}
                         className={`w-full py-6 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${isSecuring ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:bg-blue-600 shadow-blue-100 active:scale-[0.98]'}`}
                       >
                          {isSecuring ? (
                             <span className="animate-pulse">Securing Asset...</span>
                          ) : (
                             <>
                                <span>Confirm & Secure Asset</span>
                                <CheckCircle className="w-5 h-5" />
                             </>
                          )}
                       </button>

                       <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest mt-6 leading-relaxed">
                          By clicking above, you agree to secure this asset. You will have 24 hours to complete the payment via the dashboard.
                       </p>
                    </div>
                 </div>
              </div>

              <div className="mt-8 px-4 flex items-center gap-3 justify-center">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                       <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-bold">U{i}</div>
                    ))}
                 </div>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">14 other collectors viewed this today</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
