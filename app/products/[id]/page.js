"use client";

import { useEffect, useState, use, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import ProductCard from "../../../components/ProductCard";
import Link from "next/link";
import { API_URL, API_BASE_URL, createChat, getSellerReviews, createReport } from "../../../services/api";
import { useRouter } from "next/navigation";
import socket from "../../../services/socket";
import ProfileOnboardingModal from "../../../components/ProfileOnboardingModal";


export default function ProductPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const [notFound, setNotFound] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [sellerListings, setSellerListings] = useState([]);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average_rating: 0, review_count: 0 });
  const [copied, setCopied] = useState(false);
  
  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  
  // Offer State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerSending, setOfferSending] = useState(false);
  
  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSending, setReportSending] = useState(false);

  // Bid State
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidHistory, setBidHistory] = useState([]);
  const [bidSending, setBidSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetch(`${API_URL}/users/${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
           setUser(data);
           localStorage.setItem("user", JSON.stringify({...parsedUser, ...data}));
        })
        .catch(console.error);

      fetch(`${API_URL}/watchlist/${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setIsInWatchlist(data.some(item => item.product_id === parseInt(id)));
          }
        })
        .catch(err => console.error("Failed to fetch watchlist:", err));
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    
    socket.emit("joinAuction", id);

    const handleNewBid = (data) => {
      console.log("Real-time bid received:", data);
      // Update bid history
      setBidHistory(prev => {
        // Avoid duplicate bids if fetch also happens
        if (prev.some(b => b.bid_amount === data.bid_amount)) return prev;
        const newBid = {
          bid_amount: data.bid_amount,
          user_name: data.user_name || "Recent Bidder",
          created_at: new Date().toISOString()
        };
        return [newBid, ...prev];
      });
      // Update product end time if extended
      if (data.auction_end) {
        setProduct(prev => ({ ...prev, auction_end: data.auction_end }));
      }
    };

    socket.on("newBid", handleNewBid);

    return () => {
      socket.off("newBid", handleNewBid);
    };
  }, [id]);

  useEffect(() => {
    if (!product?.allow_auction || !product?.auction_end) return;

    const calculateTimeLeft = () => {
      const difference = new Date(product.auction_end) - new Date();
      if (difference <= 0) return "AUCTION ENDED";

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      return `${hours}h ${minutes}m ${seconds}s`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [product?.auction_end, product?.allow_auction]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let viewerId = "";
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        viewerId = parsed.id;
      } catch (e) {
        console.error("Error parsing user for view tracking", e);
      }
    }

    const url = `${API_URL}/products/${id}${viewerId ? `?viewerId=${viewerId}` : ''}`;

    fetch(url)
      .then((res) => {
        if (res.status === 404) throw new Error("404");
        return res.json();
      })
      .then((data) => setProduct(data))
      .catch(err => {
        if (err.message === "404") setNotFound(true);
        console.error(err);
      });
  }, [id]);


  useEffect(() => {
    if (product?.title || product?.category) {
      // Create a search query based on title keywords for better "similarity"
      const titleKeywords = product.title?.split(' ').filter(w => w.length > 3).slice(0, 2).join(' ') || "";
      const url = product.category 
        ? `${API_URL}/products?category=${product.category}`
        : `${API_URL}/products?search=${encodeURIComponent(titleKeywords)}`;
        
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          // Filter out current product and duplicates, limit to 4
          const filtered = data.filter(p => p.id != id);
          setRelatedProducts(filtered.slice(0, 4));
        });
    }
  }, [product, id]);

  // Fetch seller's other listings when product loads
  useEffect(() => {
    if (product?.seller_id) {
      fetch(`${API_URL}/products/my-listings/${product.seller_id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setSellerListings(data);
        })
        .catch(console.error);

      // Fetch seller reviews
      getSellerReviews(product.seller_id)
        .then(data => {
          setReviews(data.reviews || []);
          setReviewStats(data.stats || { average_rating: 0, review_count: 0 });
        })
        .catch(console.error);
      // Fetch bid history
      if (product?.allow_auction) {
        fetch(`${API_URL}/bids/history/${id}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) setBidHistory(data);
          })
          .catch(console.error);
      }
    }
  }, [product?.seller_id, product?.allow_auction, id]);

  const isSeller = user?.id === product?.seller_id;

  const handleChatWithSeller = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const chat = await createChat(product.id, user.id, product.seller_id);
      router.push(`/messages?chat=${chat.id}`);
    } catch (err) {
      console.error("Failed to initiate chat:", err);
    }
  };

  const toggleWatchlist = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      const endpoint = isInWatchlist ? "remove" : "add";
      const res = await fetch(`${API_URL}/watchlist/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, product_id: parseInt(id) }),
      });
      if (res.ok) {
        setIsInWatchlist(!isInWatchlist);
        window.dispatchEvent(new Event("watchlistUpdated"));
      }
    } catch (err) {
      console.error("Failed to update watchlist", err);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error("Failed to copy using navigator.clipboard:", err);
      });
    } else {
      // Fallback for non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Fallback: Unable to copy", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleMakeOffer = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!user.address || !user.city || !user.phone) {
       setPendingAction(() => () => setShowOfferModal(true));
       setShowOnboarding(true);
       return;
    }
    if (!offerAmount || isNaN(offerAmount) || parseFloat(offerAmount) <= 0) {
       alert("Please enter a valid offer amount.");
       return;
    }
    if (parseFloat(offerAmount) >= parseFloat(product.price)) {
       alert("Your offer must be less than the listed price. To buy at full price, use the Buy Now button.");
       return;
    }
    setOfferSending(true);
    try {
       const res = await fetch(`${API_URL}/offers/create`, {
          method: "POST",
          headers: {
             "Content-Type": "application/json",
             "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
             product_id: parseInt(id),
             buyer_id: user.id,
             seller_id: product.seller_id,
             amount: parseFloat(offerAmount),
             message: offerMessage || ""
          })
       });
       const data = await res.json();
       if (res.ok) {
          setShowOfferModal(false);
          setOfferAmount("");
          alert(`Offer of ₹${parseFloat(offerAmount).toLocaleString()} sent! ${data.remaining || ''} ${data.remaining !== undefined ? 'offer(s) remaining.' : ''}`);
       } else {
          alert(data.message || "Failed to send offer");
       }
    } catch (err) {
       alert("Error sending offer. Please try again.");
    } finally {
       setOfferSending(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!user) {
      router.push("/login?redirect=/products/" + id);
      return;
    }
    if (!user.address || !user.city || !user.phone) {
       setPendingAction(() => () => setShowBidModal(true));
       setShowOnboarding(true);
       return;
    }
    if (!bidAmount || isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
      alert("Please enter a valid bid amount.");
      return;
    }
    
    const currentHighest = bidHistory[0]?.bid_amount;
    if (currentHighest) {
       if (parseFloat(bidAmount) <= parseFloat(currentHighest)) {
         alert(`Your bid must be higher than the current highest bid of ₹${parseFloat(currentHighest).toLocaleString()}`);
         return;
       }
    } else if (parseFloat(bidAmount) < parseFloat(product.starting_bid)) {
       alert(`Your bid must be at least the starting bid of ₹${parseFloat(product.starting_bid).toLocaleString()}`);
       return;
    }

    setBidSending(true);
    try {
      const res = await fetch(`${API_URL}/bids/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          product_id: parseInt(id),
          user_id: user.id,
          bid_amount: parseFloat(bidAmount)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowBidModal(false);
        setBidAmount("");
        // Refresh bid history
        const historyRes = await fetch(`${API_URL}/bids/history/${id}`);
        const historyData = await historyRes.json();
        if (Array.isArray(historyData)) setBidHistory(historyData);
        alert("Bid placed successfully!");
      } else {
        alert(data.message || "Failed to place bid");
      }
    } catch (err) {
      alert("Error placing bid. Please try again.");
    } finally {
      setBidSending(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push("/login?redirect=/products/" + id);
      return;
    }
    if (!user.address || !user.city || !user.phone) {
       setPendingAction(() => () => handleBuyNow());
       setShowOnboarding(true);
       return;
    }
    
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
        alert(data.message || "Deal secured successfully. Redirecting to your active deals to complete payment.");
        router.push("/profile?tab=buying");
      } else {
        alert(data.message || "Failed to initiate buy now.");
      }
    } catch (err) {
      alert("Error processing your request. Please try again.");
    }
  };

  const handleReportSeller = async () => {
    if (!reportReason) {
       alert("Please select a reason for reporting.");
       return;
    }
    setReportSending(true);
    try {
       const res = await createReport({
          reported_user_id: product.seller_id,
          product_id: product.id,
          reason: reportReason,
          description: reportDescription
       });
       if (res.report) {
          alert("Report submitted successfully.");
          setShowReportModal(false);
          setReportReason("");
          setReportDescription("");
       } else {
          alert(res.message || "Failed to submit report");
       }
    } catch (err) {
       alert("Error submitting report.");
    } finally {
       setReportSending(false);
    }
  };


  const mediaItems = useMemo(() => {
    const list = [];
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach(img => {
        list.push({
          url: img.startsWith('http') ? img : `${API_BASE_URL}/uploads/${img}`,
          type: img.match(/\.(mp4|mov|webm|quicktime)$/i) ? 'video' : 'image'
        });
      });
    } else if (product?.image) {
      list.push({
        url: product.image.startsWith('http') ? product.image : `${API_BASE_URL}/uploads/${product.image}`,
        type: product.image.match(/\.(mp4|mov|webm|quicktime)$/i) ? 'video' : 'image'
      });
    }

    if (list.length === 0) {
      list.push({
        url: "https://www.omegawatches.com/chronicle/img/template/mobile/1952/1952-the-first-model-in-the-omega-constellation-collection.jpg",
        type: 'image'
      });
    }
    return list;
  }, [product]);

  const [zoom, setZoom] = useState({ x: 0, y: 0, show: false });
  const [selectedImage, setSelectedImage] = useState(0);

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev + 1) % mediaItems.length);
  };

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoom({ x, y, show: true });
  };

  const handleOnboardingComplete = (updatedUser) => {
     setUser(updatedUser);
     localStorage.setItem("user", JSON.stringify({...JSON.parse(localStorage.getItem("user")), ...updatedUser}));
     setShowOnboarding(false);
     if (pendingAction) {
        pendingAction();
        setPendingAction(null);
     }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <Navbar />
        <div className="max-w-[1300px] mx-auto px-4 py-32 text-center">
           <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 uppercase tracking-tighter">Asset Not Found</h1>
           <Link href="/" className="inline-block px-12 py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition shadow-xl">Return to Marketplace</Link>
        </div>
      </div>
    );
  }

  if (!product) return <div className="min-h-screen bg-white"><Navbar /><div className="flex items-center justify-center h-[60vh]"><div className="animate-pulse text-blue-600 font-black uppercase tracking-widest text-xs">Decrypting Asset...</div></div></div>;

  return (
    <div className="bg-[#f7f7f7] min-h-screen pb-20 font-sans text-[#191919]">
      <ProfileOnboardingModal 
         isOpen={showOnboarding} 
         onClose={() => setShowOnboarding(false)} 
         user={user} 
         onComplete={handleOnboardingComplete} 
      />
      <Navbar />

      <main className="max-w-[1300px] mx-auto px-4 py-4 md:py-8">
        <nav className="text-[11px] text-gray-400 mb-8 flex gap-3 font-bold uppercase tracking-widest items-center">
          <Link href="/" className="hover:text-blue-600 transition">Marketplace Home</Link>
          <span className="opacity-30">/</span>
          <span className="text-gray-900 truncate font-semibold">{product.title}</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Gallery */}
            <div className="lg:col-span-6 p-6 md:p-10 border-r border-gray-100 bg-gray-50/10">
              <div 
                className="aspect-square bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group/gallery"
                onMouseMove={mediaItems[selectedImage]?.type === 'image' ? handleMouseMove : null}
                onMouseLeave={() => setZoom({ ...zoom, show: false })}
              >
                {mediaItems[selectedImage]?.type === 'video' ? (
                  <video 
                    src={mediaItems[selectedImage].url} 
                    className="w-full h-full object-contain" 
                    controls 
                    autoPlay 
                    muted 
                  />
                ) : (
                  <img
                    src={mediaItems[selectedImage]?.url}
                    alt={product.title}
                    className={`w-full h-full object-contain mix-blend-multiply p-8 transition-transform duration-500 ease-out ${zoom.show ? 'scale-175' : 'scale-100'}`}
                    style={zoom.show ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : {}}
                  />
                )}

                {/* Navigation Arrows */}
                {mediaItems.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-gray-100 flex items-center justify-center text-gray-900 shadow-lg opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white hover:scale-110 active:scale-95 z-10"
                      title="Previous Photo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-gray-100 flex items-center justify-center text-gray-900 shadow-lg opacity-0 group-hover/gallery:opacity-100 transition-all hover:bg-white hover:scale-110 active:scale-95 z-10"
                      title="Next Photo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                    </button>

                    {/* Counter Indicator */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/70 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest pointer-events-none shadow-xl">
                       {selectedImage + 1} <span className="text-white/40 mx-1">/</span> {mediaItems.length}
                    </div>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3 mt-6">
                 {mediaItems.map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSelectedImage(i)}
                      className={`aspect-square bg-white border rounded-lg overflow-hidden transition-all relative ${selectedImage === i ? "border-blue-600 shadow-md ring-2 ring-blue-50" : "border-gray-100 opacity-60 hover:opacity-100"}`}
                    >
                       {item.type === 'video' ? (
                         <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                         </div>
                       ) : (
                         <img src={item.url} className="w-full h-full object-cover" />
                       )}
                    </button>
                 ))}
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-6 p-8 md:p-12 flex flex-col">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-6">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">{product.condition_code || "PRE-OWNED"}</span>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                       <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          {product.views || 0}
                       </span>
                       <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                       <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-rose-500 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                          {product.wishlist_count || 0}
                       </span>
                    </div>
                 </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-950 leading-tight tracking-tight mb-6 uppercase">
                  {product.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    Professional Hub Authentication
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Verified Listing
                  </div>
                </div>

                <div className="mt-10 p-8 md:p-10 bg-gray-50/50 rounded-2xl border border-gray-100 relative overflow-hidden">
                  <div className="space-y-6 relative z-10">
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Live Valuation</p>
                       <div className="flex flex-col gap-1">
                          <span className="text-4xl md:text-5xl font-bold text-gray-950 tracking-tight">₹{parseFloat(product?.price || 0).toLocaleString()}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                             <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                             <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                                {product.shipping_type === 'free' ? (
                                   <span className="text-emerald-600">Free Shipping</span>
                                ) : product.shipping_type === 'contact' ? (
                                   <span className="text-blue-600">Contact for Shipping Quote</span>
                                ) : (
                                   <>+ ₹{parseFloat(product.shipping_fee || 0).toLocaleString()} Shipping</>
                                )}
                             </span>
                          </div>
                       </div>
                    </div>
                  </div>
                    
                    <div className="pt-6">
                      <div className="flex flex-col gap-4">
                        {isSeller ? (
                           <Link 
                             href={`/sell?edit=${product.id}`}
                             className="w-full h-14 bg-emerald-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-3 group"
                           >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              <span>Manage This Listing</span>
                           </Link>
                        ) : (
                           <>
                              {product.allow_buy_now && (
                                <button 
                                  onClick={handleBuyNow}
                                  className="w-full h-14 bg-blue-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 group"
                                >
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                   <span>Buy It Now - ₹{parseFloat(product.buy_it_now_price || product.price).toLocaleString()}</span>
                                </button>
                              )}

                              {product.allow_auction && (
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                      {bidHistory.length > 0 ? "Current Bid" : "Starting Bid"}
                                    </span>
                                    <span className="text-sm font-black text-gray-900">
                                      ₹{parseFloat(bidHistory[0]?.bid_amount || product.starting_bid).toLocaleString()}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      if (!user) return router.push("/login?redirect=/products/" + id);
                                      setShowBidModal(true);
                                    }}
                                    disabled={timeLeft === "AUCTION ENDED"}
                                    className={`w-full h-14 text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-3 group ${timeLeft === "AUCTION ENDED" ? 'bg-gray-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-100'}`}
                                  >
                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                     <span>{timeLeft === "AUCTION ENDED" ? "Auction Ended" : "Place Bid"}</span>
                                  </button>
                                  {product.auction_end && (
                                    <div className="flex flex-col items-center gap-1">
                                       <p className="text-[10px] text-center font-bold text-amber-600 uppercase tracking-widest animate-pulse">
                                          {timeLeft}
                                       </p>
                                       <p className="text-[8px] text-center font-bold text-gray-400 uppercase tracking-widest">
                                          Ends: {new Date(product.auction_end).toLocaleString()}
                                       </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {product.allow_offers && (
                                 <button 
                                   onClick={() => {
                                     if (!user) return router.push("/login?redirect=/products/" + id);
                                     setShowOfferModal(true);
                                   }}
                                   className="w-full h-14 bg-white border-2 border-gray-900 text-gray-900 rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-gray-50 transition-all flex items-center justify-center gap-3 group"
                                 >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>Make Offer</span>
                                 </button>
                              )}

                              <button 
                                 onClick={handleChatWithSeller}
                                 className="w-full h-14 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center gap-3 group"
                              >
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                 </svg>
                                 <span>Chat with Seller</span>
                              </button>
                           </>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mt-4">Direct acquisition via verified hub support</p>
                  </div>

                <div className={`mt-10 grid gap-3 ${isSeller ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {!isSeller && (
                    <button 
                      onClick={toggleWatchlist}
                      className={`bg-white border px-6 py-4 rounded-lg font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isInWatchlist ? 'border-rose-200 text-rose-600 bg-rose-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                       <svg className={`w-4 h-4 ${isInWatchlist ? 'text-rose-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                       {isInWatchlist ? 'Watchlisted' : 'Watchlist'}
                    </button>
                  )}
                  <button 
                    onClick={handleShare}
                    className="bg-white border border-gray-100 text-gray-400 px-6 py-4 rounded-lg font-bold text-[11px] uppercase tracking-widest hover:text-gray-900 hover:border-gray-200 transition-all w-full"
                  >
                    {copied ? 'Copied!' : 'Share Listing'}
                  </button>
               </div>

               {/* Seller Profile Card */}
               {product.seller_id && (
                 <div className="mt-8 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                   <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                         {(product.seller_name || 'S').charAt(0).toUpperCase()}
                       </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="font-bold text-gray-900 text-base">{product.seller_name || `Seller #${product.seller_id}`}</p>
                             {product.seller_verified && (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                  Verified
                                </span>
                             )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg 
                                  key={star} 
                                  className={`w-3 h-3 ${star <= Math.round(reviewStats.average_rating) ? 'text-amber-400 fill-current' : 'text-gray-200 fill-current'}`} 
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-gray-900">{reviewStats.average_rating}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">({reviewStats.review_count} reviews)</span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">{sellerListings.length} listing{sellerListings.length !== 1 ? 's' : ''} on the Hub</p>
                          {(product.seller_city || product.seller_state) && (
                            <div className="flex items-center gap-1.5 mt-2 text-[#1e3a5f]">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-[10px] font-black uppercase tracking-tight">
                                {[product.seller_city, product.seller_state].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                     </div>
                   </div>

                   <div className="flex flex-col gap-3">
                     <button 
                       onClick={() => setShowItemsModal(true)}
                       className="w-full py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-900 uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center gap-2 group"
                     >
                       <span>Seller other items</span>
                       <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                     </button>
                     
                     {(!user || user.id !== product.seller_id) && (
                        <button 
                          onClick={() => {
                             if (!user) return router.push("/login?redirect=/products/" + id);
                             setShowReportModal(true);
                          }}
                          className="w-full text-center text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors mt-2"
                        >
                          Report Seller
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Grid (Specs & Condition) */}
        <section className="mt-20">
           <h2 className="text-xl font-bold text-gray-950 tracking-tight mb-8">Technical Asset Specifications</h2>
           <div className="bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 overflow-hidden">
              {Object.entries(product.item_specifics || {})
                .filter(([key]) => !key.endsWith('_manual_mode'))
                .map(([key, value], i) => (
                <div key={key} className="p-8 border-b border-gray-50 md:border-r hover:bg-gray-50 transition-colors">
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{key.replace(/_/g, ' ')}</p>
                   <p className="text-base font-bold text-gray-900 uppercase">{value}</p>
                </div>
              ))}
              {/* Fallback internal fields */}
              {!product.item_specifics && [
                { l: "Ref", v: product.reference_number },
                { l: "Year", v: product.year },
                { l: "Case", v: product.case_size + "mm" },
                { l: "Movement", v: product.movement_type }
              ].map((s, i) => (
                <div key={i} className="p-8 border-b border-gray-50 md:border-r hover:bg-gray-50 transition-colors">
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{s.l}</p>
                   <p className="text-base font-bold text-gray-900 uppercase">{s.v || "N/A"}</p>
                </div>
              ))}
           </div>
        </section>

        {/* Extended Data Tabs */}
        <section className="mt-20">
             <div className="flex gap-10 border-b border-gray-100 mb-10 overflow-x-auto no-scrollbar">
              {["description", "condition"].map(t => {
                return (
                  <button 
                    key={t} onClick={() => setActiveTab(t)}
                    className={`pb-4 text-[12px] font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400"}`}
                  >
                    {t}
                  </button>
                );
              })}
           </div>

           <div className="max-w-4xl">
              {activeTab === "description" && (
                <div className="animate-in fade-in duration-500">
                    {product.description ? (
                       <p className="text-base font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                    ) : (
                       <div className="p-6 border border-dashed border-gray-200 rounded-2xl text-center">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">No Description Provided</p>
                          <p className="text-sm font-medium text-gray-500 italic">The seller has not provided any additional context or provenance details for this asset.</p>
                       </div>
                    )}
                </div>
              )}
              {activeTab === "condition" && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-500">
                   <div className="col-span-full mb-4">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Overall Grade</p>
                      <div className="inline-block px-4 py-2 bg-gray-50 rounded-lg text-sm font-bold text-gray-900 border border-gray-100 uppercase">
                         {product.condition_code ? product.condition_code.replace(/_/g, ' ') : "Not Specified"}
                      </div>
                   </div>
                   {product.condition_details && Object.entries(product.condition_details)
                      .filter(([key]) => !key.endsWith('_manual_mode'))
                      .map(([key, value]) => (
                      <div key={key} className="p-5 border border-gray-100 rounded-xl bg-gray-50/30">
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{key.replace(/_/g, ' ')}</p>
                         <p className="text-sm font-bold text-gray-900 uppercase leading-snug">{value}</p>
                      </div>
                   ))}
                   {(!product.condition_details || Object.keys(product.condition_details).length === 0) && (
                      <div className="col-span-full p-6 border border-dashed border-gray-200 rounded-2xl text-center">
                         <p className="text-sm font-medium text-gray-400 italic">No specific technical condition details provided.</p>
                      </div>
                   )}
                 </div>
               )}

           </div>
        </section>

        {/* Related Products Discovery */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 border-t border-gray-100 pt-20 pb-10">
             <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                   <h2 className="text-3xl font-black text-gray-950 tracking-tighter uppercase mb-2 animate-in slide-in-from-left duration-700">Expert Curation: Similarity Asset Discoveries</h2>
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] animate-in slide-in-from-left duration-1000">Discover more premium assets with comparable provenance and features</p>
                </div>
                <Link 
                  href={product.category ? `/search?category=${product.category}` : '/'} 
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-black transition-colors flex items-center gap-2 group"
                >
                   Explore Entire Collection
                   <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.map((item, idx) => (
                   <div key={item.id} className="animate-in fade-in zoom-in-95 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                      <ProductCard product={item} />
                   </div>
                ))}
             </div>
          </section>
        )}

      </main>

      {/* Collector Reviews Section */}
      <section className="bg-white border-t border-gray-100 py-24">
        <div className="max-w-[1300px] mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div>
              <h2 className="text-3xl font-black text-gray-950 tracking-tighter uppercase mb-3">Collector Feedback</h2>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Authentic experiences from the watch community</p>
            </div>
            <div className="flex items-center gap-6 bg-gray-50 px-8 py-5 rounded-2xl border border-gray-100">
               <div className="text-center border-r border-gray-200 pr-6">
                  <p className="text-3xl font-black text-gray-950">{reviewStats.average_rating}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Average Stars</p>
               </div>
               <div className="pl-2">
                  <div className="flex items-center gap-1 mb-1">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(reviewStats.average_rating) ? 'text-amber-400' : 'text-gray-200'} fill-current`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Based on {reviewStats.review_count} verified reviews</p>
               </div>
            </div>
          </div>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gray-50/50 border border-gray-100 p-8 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {review.reviewer_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{review.reviewer_name}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'} fill-current`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-[13px] text-gray-600 leading-relaxed font-medium italic">"{review.comment}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-gray-50 rounded-[40px] bg-gray-50/20">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-50">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
               </div>
               <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]">No Public Feedback Logged Yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Seller Items Modal */}
      {showItemsModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
             onClick={() => setShowItemsModal(false)}
           />
           
           {/* Content */}
           <div className="relative w-full max-w-4xl max-h-full bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                 <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Seller Collection</h3>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Exhibiting {sellerListings.length} active listings on the hub</p>
                 </div>
                 <button 
                   onClick={() => setShowItemsModal(false)}
                   className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sellerListings.map(item => (
                       <Link 
                          key={item.id}
                          href={`/products/${item.id}`}
                          onClick={() => setShowItemsModal(false)}
                          className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:shadow-gray-200/50 transition-all group flex flex-col sm:flex-row gap-4 sm:gap-5"
                       >
                          <div className="w-full sm:w-24 h-48 sm:h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                             <img 
                               src={item.images?.[0] ? (item.images[0].startsWith('http') ? item.images[0] : `${API_BASE_URL}/uploads/${item.images[0]}`) : 'https://www.omegawatches.com/chronicle/img/template/mobile/1952/1952-the-first-model-in-the-omega-constellation-collection.jpg'} 
                               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                             />
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                             <div className="flex justify-between items-start gap-2">
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">{item.category || 'Asset'}</p>
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{item.condition_code || 'Pre-Owned'}</span>
                             </div>
                             <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight truncate mb-1">{item.title}</h4>
                             <p className="text-lg font-black text-gray-950">₹{parseFloat(item.price).toLocaleString()}</p>
                             <div className="mt-3 flex items-center gap-2">
                                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">View Details</span>
                                <svg className="w-3 h-3 text-gray-300 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                             </div>
                          </div>
                       </Link>
                    ))}
                 </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-white flex justify-center">
                 <button 
                   onClick={() => setShowItemsModal(false)}
                   className="px-12 py-3.5 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-blue-600 transition-all"
                 >
                    Close Gallery
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Share Feedback Toast */}
      {copied && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1001] bg-gray-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
           <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
           </svg>
           <span className="text-[11px] font-black uppercase tracking-widest">Link copied to clipboard</span>
        </div>
      )}
      {/* Bid Modal */}
      {showBidModal && (
         <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBidModal(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Place Your Bid</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Acquire this asset via auction</p>
                  </div>
                  <button onClick={() => setShowBidModal(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               <div className="p-8 space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col items-center">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Current Highest Bid</p>
                     <p className="text-3xl font-black text-gray-900">₹{parseFloat(bidHistory[0]?.bid_amount || product.starting_bid).toLocaleString()}</p>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Bid Amount (₹)</label>
                     <input 
                       type="number" 
                       value={bidAmount}
                       onChange={e => setBidAmount(e.target.value)}
                       placeholder={`Next bid: ₹${(parseFloat(bidHistory[0]?.bid_amount || product.starting_bid) + 1).toLocaleString()}`}
                       className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl text-lg font-black outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all"
                     />
                  </div>
                  <button 
                    onClick={handlePlaceBid}
                    disabled={bidSending || !bidAmount}
                    className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-700 transition-all shadow-xl shadow-amber-100 disabled:opacity-50"
                  >
                     {bidSending ? "Transmitting..." : "Confirm Bid"}
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOfferModal(false)} />
           <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Make an Offer</h3>
                 <button onClick={() => setShowOfferModal(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Offer Amount (₹)</label>
                    <input 
                      type="number" 
                      value={offerAmount}
                      onChange={e => setOfferAmount(e.target.value)}
                      placeholder={`Listing price: ₹${parseFloat(product.price).toLocaleString()}`}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl text-lg font-black outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Message to Seller (Optional)</label>
                    <textarea 
                      value={offerMessage}
                      onChange={e => setOfferMessage(e.target.value)}
                      placeholder="e.g. I can pick it up today if you accept this offer."
                      rows={3}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none"
                    />
                 </div>
                 <button 
                   onClick={handleMakeOffer}
                   disabled={offerSending || !offerAmount}
                   className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
                 >
                    {offerSending ? "Transmitting..." : "Submit Offer"}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
           <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Report Listing</h3>
                 <button onClick={() => setShowReportModal(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reason</label>
                    <select 
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all"
                    >
                       <option value="">Select a reason</option>
                       <option value="counterfeit">Counterfeit Item</option>
                       <option value="fraud">Fraudulent Listing</option>
                       <option value="wrong_info">Incorrect Information</option>
                       <option value="inappropriate">Inappropriate Content</option>
                       <option value="other">Other</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Additional Details</label>
                    <textarea 
                      value={reportDescription}
                      onChange={e => setReportDescription(e.target.value)}
                      placeholder="Please provide more context for our administrators..."
                      rows={3}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all resize-none"
                    />
                 </div>
                 <button 
                   onClick={handleReportSeller}
                   disabled={reportSending || !reportReason}
                   className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-xl shadow-red-100 disabled:opacity-50"
                 >
                    {reportSending ? "Protecting Community..." : "Submit Report"}
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
