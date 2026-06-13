"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck, Clock, CheckCircle, ArrowLeft, ExternalLink, Info, CreditCard, MapPin, Lock, Package } from "lucide-react";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import CheckoutStepper from "../../../../components/CheckoutStepper";
import Navbar from "../../../../components/Navbar";
import OptimizedImage from "../../../../components/OptimizedImage";

import { API_URL, API_BASE_URL } from "../../../../services/api";
const STEPS = ["Review Order", "Payment", "Confirmation"];

export default function CheckoutPage({ params: paramsPromise }: any) {
  const params: any = use(paramsPromise);
  const id = params.id;
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSecuring, setIsSecuring] = useState(false);
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [confirmed, setConfirmed] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/login?redirect=/products/" + id);
    }

    const fetchData = async () => {
      try {
        const [productRes, settingsRes] = await Promise.all([
          fetch(`${API_URL}/products/${id}`),
          fetch(`${API_URL}/user/terms`)
        ]);
        setProduct(await productRes.json());
        setPlatformSettings(await settingsRes.json());
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleApplyCoupon = async () => {
    if (!couponCode || !user) return;
    setCouponApplying(true);
    setCouponError("");
    try {
      const res = await fetch(`${API_URL}/features/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ code: couponCode, cart_value: totalAmount, user_id: user.id })
      });
      const data = await res.json();
      if (data.valid) {
        setCouponDiscount(data.discount);
        setAppliedCoupon(data.code);
        setCouponError("");
      } else {
        setCouponError(data.error || "Invalid coupon");
        setCouponDiscount(0);
        setAppliedCoupon("");
      }
    } catch (e) {
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponApplying(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleConfirmPurchase = async () => {
    setIsSecuring(true);
    try {
      const res = await fetch(`${API_URL}/orders/buy-now`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          product_id: parseInt(id),
          buyer_id: user.id,
          coupon_code: appliedCoupon || undefined,
          discount_amount: couponDiscount > 0 ? couponDiscount : undefined
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.message || "Failed to secure deal.");
        setIsSecuring(false);
        return;
      }

      if (product.shipping_type === 'contact') {
        setConfirmed(true);
        setStep(2);
        setIsSecuring(false);
        return;
      }

      // Proceed to Razorpay
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert("Failed to load Razorpay SDK. Please check your connection.");
        setIsSecuring(false);
        return;
      }

      const orderRes = await fetch(`${API_URL}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ deal_id: data.deal.id })
      });
      const orderData = await orderRes.json();
      
      if (!orderRes.ok) {
        alert("Failed to initialize payment: " + orderData.message);
        setIsSecuring(false);
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Vintage Watch Hub",
        description: `Payment for ${product.title}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API_URL}/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                deal_id: data.deal.id
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              setConfirmed(true);
              setStep(2);
              setIsSecuring(false);
            } else {
              alert("Payment verification failed. Please contact support.");
              setIsSecuring(false);
            }
          } catch (e) {
            alert("Payment verification error.");
            setIsSecuring(false);
          }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: "#C6A87C" },
        modal: {
          ondismiss: function () {
            setIsSecuring(false);
            router.push("/profile?tab=buying");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Error securing deal. Please try again.");
      setIsSecuring(false);
    }
  };

  if (loading) return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="watch-crown-loader">
          <svg className="w-8 h-8 crown" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L15 8H9L12 2Z" /><path d="M12 6V12" />
            <rect x="8" y="12" width="8" height="8" rx="1" />
          </svg>
          <span className="tick"></span><span className="tick"></span><span className="tick"></span>
          <span className="ml-3 text-xs font-black uppercase tracking-widest text-muted">Loading</span>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs font-black uppercase tracking-widest text-rose-500">Asset Data Missing</p>
      </div>
    </div>
  );

  const itemPrice = parseFloat(product.buy_it_now_price || product.price);
  const shippingFee = product.shipping_type === 'fixed' ? parseFloat(product.shipping_fee || 0) : 0;
  const buyerCommissionRate = parseFloat(platformSettings?.buyer_commission_rate || 0);
  const buyerCommissionFee = itemPrice * (buyerCommissionRate / 100);
  const totalAmount = itemPrice + shippingFee + buyerCommissionFee;
  const totalAfterDiscount = totalAmount - couponDiscount;

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-10 w-full">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Checkout' }]} />
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => step === 0 ? router.back() : setStep(step - 1)} className="p-2.5 bg-background border border-border hover:border-gold transition-colors">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h1 className="section-title text-2xl">Checkout</h1>
            <p className="label-engraved mt-0.5">Asset #D-{id}</p>
          </div>
        </div>

        <CheckoutStepper currentStep={step + 1} steps={STEPS} />

        {step === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {/* Item Summary */}
              <div className="bg-background border border-border p-6 card-glow">
                <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gold" /> Item Details
                </h3>
                <div className="flex gap-5">
                  <div className="w-24 h-24 bg-background border border-border flex-shrink-0 overflow-hidden relative">
                    <OptimizedImage
                      src={product.images?.[0] ? (product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL}/uploads/${product.images[0]}`) : '/placeholder.png'}
                      alt={product.title}
                      fill
                      className="object-contain p-2"
                      size="small"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="label-engraved">{product.category || 'Luxury Asset'}</p>
                    <h2 className="font-serif text-lg text-foreground leading-tight mt-1">{product.title}</h2>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs font-bold text-muted uppercase tracking-widest border border-border px-2 py-0.5">{product.condition_code || 'Pre-owned'}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-200/50 px-2 py-0.5 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-background border border-border p-6 card-glow">
                <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold" /> Shipping Address
                </h3>
                <div className="bg-background border border-border p-5">
                  <p className="font-bold text-foreground">{user?.name}</p>
                  <p className="text-sm text-muted mt-1.5 leading-relaxed">{user?.address || 'No address on file'}</p>
                  <p className="text-sm text-muted">{user?.city}{user?.city && user?.state ? ', ' : ''}{user?.state} {user?.pincode}</p>
                  <p className="text-sm font-bold text-gold-dark mt-2">{user?.phone}</p>
                </div>
                <p className="text-xs text-muted mt-3 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Seller ships within 48-72 hours of payment confirmation
                </p>
              </div>

              {/* Protection */}
              <div className="border border-gold/20 bg-gold/[0.02] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-foreground text-sm">Buyer Protection Active</p>
                    <p className="text-xs text-muted mt-1">Your payment is held in escrow until you confirm receipt and authenticate the timepiece.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-2">
              <div className="bg-background border border-border p-6 sticky top-28 card-glow">
                <h3 className="font-bold text-foreground text-sm mb-6 pb-4 border-b border-border flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gold" /> Order Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted uppercase tracking-widest font-bold">Asset Price</span>
                    <span className="text-sm font-bold text-foreground">₹{itemPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted uppercase tracking-widest font-bold">Shipping</span>
                    <span className="text-sm font-bold text-foreground">{shippingFee > 0 ? `₹${shippingFee.toLocaleString()}` : 'FREE'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted uppercase tracking-widest font-bold">Buyer Premium ({buyerCommissionRate}%)</span>
                    <span className="text-sm font-bold text-foreground">₹{buyerCommissionFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted uppercase tracking-widest font-bold">Authentication</span>
                    <span className="text-sm font-bold text-emerald-600">Included</span>
                  </div>
                  {/* Coupon Code */}
                  <div className="pt-2">
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="COUPON CODE"
                        className="flex-1 px-3 py-2 bg-background border border-border text-xs font-bold uppercase tracking-widest outline-none"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode || couponApplying}
                        className="px-4 py-2 bg-black text-white rounded-lg text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:bg-primary"
                      >
                        {couponApplying ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-red-500 font-bold mt-1">{couponError}</p>}
                    {couponDiscount > 0 && (
                      <div className="flex justify-between mt-2 text-emerald-600">
                        <span className="text-xs font-bold uppercase tracking-widest">Discount ({appliedCoupon})</span>
                        <span className="text-sm font-bold">-₹{couponDiscount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-border flex justify-between items-end">
                    <span className="text-xs text-muted uppercase tracking-widest font-black">Total</span>
                    <span className="price-serif text-2xl">₹{totalAfterDiscount.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="gold-sweep w-full mt-6 py-4 text-sm font-black uppercase tracking-widest"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-background border border-border p-6 card-glow">
              <h3 className="font-bold text-foreground text-sm mb-6 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gold" /> Secure Payment
              </h3>

              <div className="space-y-4 mb-6">
                <div 
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`flex items-center gap-4 p-4 border transition-colors cursor-pointer bg-background ${paymentMethod === 'razorpay' ? 'border-gold' : 'border-border hover:border-gold/30'}`}
                >
                  <div className="w-10 h-10 bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-sm">Pay Online (Razorpay)</p>
                    <p className="text-xs text-muted">Credit/Debit card, UPI, Net Banking via Secure Escrow</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'razorpay' ? 'border-gold' : 'border-border'}`}>
                    {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-gold"></div>}
                  </div>
                </div>
              </div>

              <div className="bg-surface/50 border border-border p-4 mb-6">
                <div className="flex justify-between items-center">
                   <span className="text-sm text-muted uppercase tracking-widest font-bold">Total Due</span>
                   <span className="price-serif text-xl">₹{totalAfterDiscount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleConfirmPurchase}
                disabled={isSecuring}
                className={`gold-sweep w-full py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 ${isSecuring ? 'opacity-50' : ''}`}
              >
                {isSecuring ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    Securing Asset...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {product.shipping_type === 'contact' 
                      ? 'Request Shipping Quote & Secure Asset' 
                      : `Pay & Secure Asset — ₹${totalAfterDiscount.toLocaleString()}`}
                  </>
                )}
              </button>

              <p className="text-xs text-center text-muted font-bold uppercase tracking-widest mt-4">
                {product.shipping_type === 'contact' ? 'Seller will provide a shipping quote before you pay' : 'Funds held in escrow until you confirm receipt'}
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-background border border-border p-10 card-glow">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="section-title text-2xl mb-2">Deal Secured!</h2>
              <p className="text-muted text-sm mb-6">
                Your acquisition of <span className="font-bold text-foreground">{product.title}</span> has been initiated.
              </p>
              
              <div className="bg-surface/50 border border-border p-5 mb-6 text-left">
                <h4 className="font-bold text-foreground text-xs mb-3 uppercase tracking-widest">Next Steps</h4>
                <ul className="space-y-3">
                  {product.shipping_type === 'contact' ? (
                    <>
                      <li className="flex items-start gap-2 text-sm text-muted">
                        <span className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs text-gold font-black">1</span></span>
                        Wait for the seller to provide a shipping quote.
                      </li>
                      <li className="flex items-start gap-2 text-sm text-muted">
                        <span className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs text-gold font-black">2</span></span>
                        Complete payment via the Buyer Hub once quoted.
                      </li>
                      <li className="flex items-start gap-2 text-sm text-muted">
                        <span className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs text-gold font-black">3</span></span>
                        Inspect and confirm receipt to release payment.
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2 text-sm text-muted">
                        <span className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs text-gold font-black">1</span></span>
                        Your payment is held safely in Escrow.
                      </li>
                      <li className="flex items-start gap-2 text-sm text-muted">
                        <span className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs text-gold font-black">2</span></span>
                        Seller ships the timepiece within 48-72 hours
                      </li>
                      <li className="flex items-start gap-2 text-sm text-muted">
                        <span className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs text-gold font-black">3</span></span>
                        Inspect and confirm receipt to release payment
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push("/profile?tab=buying")}
                  className="gold-sweep w-full py-4 text-sm font-black uppercase tracking-widest"
                >
                  Go to Buyer Hub
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="gold-sweep-outline w-full py-4 text-sm font-black uppercase tracking-widest"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
