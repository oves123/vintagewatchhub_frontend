"use client";

import { useState, useEffect, useRef, Fragment, Suspense, useMemo } from "react";
import { Image, X, PlayCircle, Search, MoreVertical, Send, Smile, Paperclip } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { 
  getUserChats, 
  getChatMessages, 
  sendChatMessage, 
  markChatAsRead, 
  uploadChatImage, 
  getUiLabels, 
  getQuickReplies,
  confirmDirectDeal,
  markOrderShipped,
  markOrderDelivered,
  confirmOrderReceived,
  confirmOrderSale,
  getUserDeals,
  createOffer,
  respondToOffer,
  updateMessageStatus,
  API_BASE_URL 
} from "../../services/api";
import { CheckCircle, Truck, Info, AlertCircle, Package, Clock } from "lucide-react";
import socket from "../../services/socket";
import "./messages.css";

function MessagesContent() {
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get("chat");
  
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [toast, setToast] = useState(null);
  const [labels, setLabels] = useState({});
  const [quickReplies, setQuickReplies] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [finalPrice, setFinalPrice] = useState("");
  const [offerCounterForm, setOfferCounterForm] = useState({ offerId: null, amount: "" });
  const [currentDeal, setCurrentDeal] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState({ courier: "", number: "" });
  const fileInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Initial Data Loading
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    getUiLabels().then(setLabels).catch(console.error);
    getQuickReplies().then(setQuickReplies).catch(console.error);
  }, []);

  useEffect(() => {
    if (user) {
      loadChats();
      socket.emit("registerUser", user.id);
    }
  }, [user]);

  // Socket Listeners
  useEffect(() => {
    const handleUserStatus = ({ userId, status }) => {
      setOnlineUsers(prev => {
        const isOnline = prev.has(userId);
        if (status === "online" && isOnline) return prev;
        if (status === "offline" && !isOnline) return prev;
        
        const next = new Set(prev);
        if (status === "online") next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    const handleNewMessage = (msg) => {
      if (msg.chat_id === activeChat?.id) {
        setMessages((prev) => [...prev, msg]);
        handleMarkAsRead(activeChat.id);
      } else {
        setChats(prev => prev.map(c => 
          c.id === msg.chat_id ? { 
            ...c, 
            unread_count: (parseInt(c.unread_count) || 0) + 1, 
            last_message: msg.message, 
            last_message_at: msg.created_at 
          } : c
        ));
      }
    };

    socket.on("userStatus", handleUserStatus);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("userStatus", handleUserStatus);
      socket.off("newMessage", handleNewMessage);
    };
  }, [activeChat]);

  // Chat/Messages Loading
  useEffect(() => {
    if (initialChatId && chats.length > 0) {
      const chat = chats.find(c => c.id === parseInt(initialChatId));
      if (chat && activeChat?.id !== chat.id) setActiveChat(chat);
    }
  }, [initialChatId, chats, activeChat?.id]);

  useEffect(() => {
    if (activeChat?.id) {
      loadMessages(activeChat.id);
      socket.emit("joinChat", activeChat.id);
      handleMarkAsRead(activeChat.id);
      
      const otherId = activeChat.buyer_id === user?.id ? activeChat.seller_id : activeChat.buyer_id;
      if (otherId) socket.emit("checkStatus", otherId);
      
      // Load any active deal for this chat
      loadActiveDeal();
    }
  }, [activeChat?.id, user?.id]);

  const loadActiveDeal = async () => {
    if (!activeChat || !user) return;
    try {
      const deals = await getUserDeals(user.id);
      const deal = deals.find(d => d.product_id === activeChat.product_id && d.status !== 'CANCELLED' && d.status !== 'EXPIRED');
      setCurrentDeal(deal);
    } catch (err) {
      console.error("Failed to load deals:", err);
    }
  };

  const loadChats = async () => {
    try {
      const data = await getUserChats(user.id);
      setChats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const data = await getChatMessages(chatId);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (chatId) => {
    if (!user) return;
    try {
      await markChatAsRead(chatId, user.id);
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, unread_count: 0 } : c
      ));
    } catch (err) {
      console.error(err);
    }
  };

  // Media & Messaging
  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;

    const isVideo = file.type.startsWith('video');
    const limit = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (file.size > limit) {
      showToast(`File size too large (max ${isVideo ? '20MB' : '5MB'})`, "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await uploadChatImage(formData);
      if (res.filename) {
        await sendQuickMessage(res.filename, isVideo ? 'video' : 'image');
      }
    } catch (err) {
      console.error("Upload failed:", err);
      showToast("Failed to upload media", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const res = await sendChatMessage(activeChat.id, user.id, newMessage);
      if (res.id) {
        setMessages([...messages, res]);
        setNewMessage("");
        loadChats(); // Refresh last message in sidebar
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const sendQuickMessage = async (text, type = 'text', metadata = {}) => {
    try {
      const res = await sendChatMessage(activeChat.id, user.id, text, type, metadata);
      if (res.id) {
        setMessages([...messages, res]);
        loadChats();
      }
    } catch (err) {
      console.error("Error sending quick message:", err);
    }
  };

  const handleMakeOffer = async () => {
    const amount = prompt("Enter your offer amount (₹):");
    if (amount && !isNaN(amount)) {
      try {
        const res = await createOffer({
          product_id: activeChat.product_id,
          buyer_id: user.id,
          seller_id: activeChat.buyer_id === user.id ? activeChat.seller_id : activeChat.buyer_id,
          amount: parseFloat(amount),
          message: `I'd like to offer ₹${amount}`
        });

        if (res.offer) {
          sendQuickMessage(`OFFER: ₹${amount}`, 'offer', { amount: parseFloat(amount), status: 'pending', offer_id: res.offer.id });
          showToast("Offer sent successfully!");
        } else {
          showToast(res.message || "Failed to make offer", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Error sending offer", "error");
      }
    }
  };

  const handleOfferResponseInChat = async (offerId, status, messageId, counterAmount = null) => {
    try {
      const res = await respondToOffer(offerId, status, counterAmount);
      if (res.offer || res.message) {
        if (messageId) {
          await updateMessageStatus(messageId, status);
          setMessages(prev => prev.map(m => 
            m.id === messageId 
              ? { ...m, metadata: { ...m.metadata, status, counter_amount: counterAmount } }
              : m
          ));
        }

        // If it's a counter, send a text message to notify the buyer/seller
        if (status === 'countered') {
           await sendQuickMessage(`COUNTER OFFER: ₹${parseFloat(counterAmount).toLocaleString()}`, 'text');
        } else {
           await sendQuickMessage(`Offer ${status.toUpperCase()}!`, 'text');
        }

        showToast(`Offer ${status} successfully.`);
        if (status === 'accepted') loadActiveDeal();
        loadMessages(activeChat.id); // Refresh messages to show latest status
      } else {
        showToast(res.message || "Failed to respond", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error responding to offer", "error");
    }
  };

  const handleConfirmDirectDeal = async () => {
    if (!finalPrice || isNaN(finalPrice)) {
      showToast("Please enter a valid price", "error");
      return;
    }

    try {
      const res = await confirmDirectDeal(activeChat.id, user.id, finalPrice);
      if (res.deal) {
        showToast("Deal confirmed! Please ship the item.");
        setShowDealModal(false);
        loadActiveDeal();
        loadMessages(activeChat.id);
      } else {
        showToast(res.message || "Failed to confirm deal", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred", "error");
    }
  };

  const handleShipItem = async () => {
    if (!trackingInfo.number) {
      showToast("Tracking number is required", "error");
      return;
    }

    try {
      const res = await markOrderShipped(currentDeal.id, user.id, {
        courier_name: trackingInfo.courier,
        tracking_number: trackingInfo.number
      });
      if (res.message) {
        showToast(res.message);
        loadActiveDeal();
        loadMessages(activeChat.id);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to mark as shipped", "error");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    return chats.filter(c => {
      const otherName = c.buyer_id === user.id ? c.seller_name : c.buyer_name;
      return otherName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             c.product_title?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [chats, searchQuery, user]);

  if (!user) return <div className="min-h-screen bg-white"><Navbar /><div className="flex items-center justify-center h-[60vh] gap-3"><div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div><span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Authenticating Session...</span></div></div>;

  return (
    <div className="h-screen bg-[#f4f7f6] flex flex-col font-sans overflow-hidden">
      <Navbar />
      
      <div className="flex-grow flex overflow-hidden lg:p-4 p-0">
        <main className="flex-grow flex overflow-hidden bg-white shadow-2xl rounded-none lg:rounded-2xl max-w-[1400px] mx-auto w-full border border-gray-100 overflow-hidden">
          
          {/* SIDEBAR: EBAY/OLX STYLE */}
          <aside className={`w-full md:w-[350px] lg:w-[380px] flex flex-col border-r border-gray-100 bg-white shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-5 border-b border-gray-50 bg-white">
               <h2 className="text-xl font-bold text-gray-900 tracking-tight">{labels.chat_sidebar_title || "Messages"}</h2>
               <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder={labels.chat_search_placeholder || "Search or start new chat"} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                  />
               </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar">
               {filteredChats.length === 0 ? (
                 <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Search className="text-gray-300 w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">{labels.chat_no_conversations || "No conversations found"}</p>
                 </div>
               ) : (
                 filteredChats.map(chat => {
                    const otherId = chat.buyer_id === user.id ? chat.seller_id : chat.buyer_id;
                    const otherName = chat.buyer_id === user.id ? chat.seller_name : chat.buyer_name;
                    const otherAvatar = chat.buyer_id === user.id ? chat.seller_avatar : chat.buyer_avatar;
                    const isOnline = onlineUsers.has(otherId);
                    const isActive = activeChat?.id === chat.id;
                    const isUnread = parseInt(chat.unread_count) > 0;

                    return (
                      <div 
                        key={chat.id} 
                        onClick={() => { setActiveChat(chat); setMobileShowChat(true); }}
                        className={`group px-4 py-4 flex gap-3 cursor-pointer transition-all border-b border-gray-50/50 ${isActive ? "bg-blue-50/50 border-blue-100" : "hover:bg-gray-50"}`}
                      >
                         <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 bg-gray-50 uppercase font-black text-gray-300 flex items-center justify-center text-lg">
                               {otherAvatar ? (
                                 <img src={`${API_BASE_URL}/uploads/${otherAvatar}`} className="w-full h-full object-cover" />
                               ) : otherName?.[0]}
                            </div>
                            {isOnline && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />}
                         </div>
                         <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                               <h3 className="text-[15px] font-bold text-gray-900 truncate tracking-tight">{otherName}</h3>
                               <span className="text-[10px] font-semibold text-gray-400 uppercase">
                                  {chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                               </span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                               <p className={`text-xs truncate ${isUnread ? "font-bold text-gray-800" : "text-gray-500"}`}>
                                  {chat.last_message || labels.chat_active_listing_discussion || "Active discussion"}
                               </p>
                               {isUnread && <div className="bg-blue-600 text-white min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1">{chat.unread_count}</div>}
                            </div>
                            <Link href={`/products/${chat.product_id}`} className="mt-2 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity hover:underline">
                               <div className="w-5 h-5 rounded overflow-hidden bg-gray-100 shrink-0">
                                  <img src={`${API_BASE_URL}/uploads/${chat.product_image}`} className="w-full h-full object-cover" />
                               </div>
                               <span className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-tighter">{chat.product_title}</span>
                            </Link>
                         </div>
                      </div>
                    );
                 })
               )}
            </div>
          </aside>

          {/* CHAT AREA: MODERN CLEAN EBAY STYLE */}
          <section className={`flex-grow flex flex-col bg-white relative min-w-0 ${mobileShowChat ? 'flex' : 'hidden md:flex'}`}>
            {activeChat ? (
              <Fragment>
                {/* MODERN HEADER */}
                <header className="h-[75px] border-b border-gray-100 px-3 md:px-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
                   <div className="flex items-center gap-4 min-w-0">
                      <button onClick={() => setMobileShowChat(false)} className="md:hidden p-2 hover:bg-gray-50 rounded-full transition-colors">
                         <X className="w-5 h-5 text-gray-500" />
                      </button>
                      
                      <div className="relative shrink-0">
                         <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 bg-gray-50 font-bold text-gray-300 flex items-center justify-center">
                            {(activeChat.buyer_id === user.id ? activeChat.seller_avatar : activeChat.buyer_avatar) ? (
                              <img src={`${API_BASE_URL}/uploads/${activeChat.buyer_id === user.id ? activeChat.seller_avatar : activeChat.buyer_avatar}`} className="w-full h-full object-cover" />
                            ) : (activeChat.buyer_id === user.id ? activeChat.seller_name : activeChat.buyer_name)?.[0]}
                         </div>
                         {onlineUsers.has(activeChat.buyer_id === user.id ? activeChat.seller_id : activeChat.buyer_id) && (
                           <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                         )}
                      </div>

                      <div className="min-w-0 flex-shrink">
                         <div className="flex items-center gap-1.5 md:gap-2">
                           <h3 className="font-bold text-[14px] md:text-[16px] text-gray-900 truncate tracking-tight">{activeChat.buyer_id === user.id ? activeChat.seller_name : activeChat.buyer_name}</h3>
                           <span className={`text-[8px] md:text-[10px] font-black uppercase px-1.5 md:px-2 py-0.5 rounded-full ${onlineUsers.has(activeChat.buyer_id === user.id ? activeChat.seller_id : activeChat.buyer_id) ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"}`}>
                              {onlineUsers.has(activeChat.buyer_id === user.id ? activeChat.seller_id : activeChat.buyer_id) ? (labels.chat_online_status || "Online") : (labels.chat_offline_status || "Offline")}
                           </span>
                         </div>
                         <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                            <span className="hidden sm:inline text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-tight">{labels.chat_discussing_prefix || "Discussing:"}</span>
                            <Link href={`/products/${activeChat.product_id}`} className="text-[10px] md:text-[11px] font-black text-blue-600 uppercase tracking-tight hover:underline cursor-pointer truncate max-w-[100px] sm:max-w-none">
                               {activeChat.product_title} - ₹{parseFloat(activeChat.product_price || 0).toLocaleString()}
                            </Link>
                         </div>
                      </div>
                   </div>

                       <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
                          {activeChat.product_status !== 'sold' && !currentDeal && (
                            <div className="flex gap-1 md:gap-2">
                              {activeChat.seller_id === user.id && (
                                <button 
                                  onClick={() => { setFinalPrice(activeChat.product_price); setShowDealModal(true); }}
                                  className="bg-emerald-600 text-white px-2.5 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-1.5"
                                >
                                   <CheckCircle className="w-3.5 h-3.5 md:w-4 h-4" />
                                   <span className="hidden sm:inline">{labels.chat_confirm_deal_btn || "Confirm Deal"}</span>
                                   <span className="sm:hidden">Confirm</span>
                                </button>
                              )}
                              {activeChat.buyer_id === user.id && (
                                <button 
                                  onClick={handleMakeOffer}
                                  className="bg-black text-white px-2.5 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-gray-200"
                                >
                                   <span className="hidden sm:inline">{labels.chat_make_offer_btn || "Make Offer"}</span>
                                   <span className="sm:hidden">Offer</span>
                                </button>
                              )}
                            </div>
                          )}
                          <button className="p-1 text-gray-400 hover:text-gray-900 transition-colors">
                             <MoreVertical className="w-4 h-4 md:w-5 h-5" />
                          </button>
                       </div>
                </header>


                {/* MESSAGES FLOW */}
                <div 
                  ref={containerRef}
                  className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-50/30 custom-scrollbar"
                >
                  {messages.map((msg, i) => {
                    const isOwn = msg.sender_id === user.id;
                    const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i-1].created_at).toDateString();
                    
                    return (
                      <Fragment key={msg.id || i}>
                        {showDate && (
                           <div className="flex justify-center my-6">
                              <span className="px-4 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] shadow-sm">
                                 {new Date(msg.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                              </span>
                           </div>
                        )}
                        
                        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
                           <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                              
                              <div className={`rounded-2xl p-3.5 shadow-sm relative group overflow-hidden ${
                                isOwn ? "bg-black text-white rounded-tr-none" : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                              }`}>
                                 
                                 {/* Offer Handling */}
                                 {msg.type === 'offer' ? (
                                    <div className="space-y-4 min-w-[200px]">
                                       <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isOwn ? "bg-white/10" : "bg-blue-50"}`}>
                                             <Send className={`w-4 h-4 ${isOwn ? "text-white" : "text-blue-600"}`} ordnance="4" />
                                          </div>
                                          <span className="text-[11px] font-black uppercase tracking-widest">{isOwn ? "OFFER SENT" : "OFFER RECEIVED"}</span>
                                       </div>
                                       <div className="space-y-1">
                                          <p className={`text-2xl font-black ${isOwn ? "text-white" : "text-gray-900"}`}>₹{msg.metadata?.amount?.toLocaleString()}</p>
                                          <p className={`text-xs ${isOwn ? "text-gray-400" : "text-gray-500"}`}>{msg.message || `OFFER: ₹${msg.metadata?.amount}`}</p>
                                       </div>
                                       {(!isOwn && msg.metadata?.offer_id && (msg.metadata?.status === 'pending' || msg.metadata?.status === 'countered')) && (
                                          <div className="space-y-3 mt-4">
                                             {offerCounterForm.offerId === msg.metadata.offer_id ? (
                                                <div className="flex flex-col gap-2 p-1 animate-in zoom-in-95 duration-200">
                                                   <input 
                                                      type="number"
                                                      placeholder="Counter amount..."
                                                      value={offerCounterForm.amount}
                                                      onChange={(e) => setOfferCounterForm({...offerCounterForm, amount: e.target.value})}
                                                      className={`w-full border rounded-xl px-4 py-2 text-xs font-bold outline-none transition-all ${
                                                        isOwn ? 'bg-white/10 border-white/20 text-white focus:border-white' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500'
                                                      }`}
                                                      autoFocus
                                                   />
                                                   <div className="flex gap-2">
                                                      <button 
                                                         onClick={() => {
                                                            if(!offerCounterForm.amount) return showToast("Enter amount", "error");
                                                            handleOfferResponseInChat(msg.metadata.offer_id, 'countered', msg.id, offerCounterForm.amount);
                                                            setOfferCounterForm({ offerId: null, amount: "" });
                                                         }}
                                                         className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition ${
                                                           isOwn ? 'bg-white text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'
                                                         }`}
                                                      >
                                                         Send
                                                      </button>
                                                      <button 
                                                         onClick={() => setOfferCounterForm({ offerId: null, amount: "" })}
                                                         className={`flex-1 border py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition ${
                                                           isOwn ? 'border-white/20 text-white/60 hover:bg-white/5' : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                                                         }`}
                                                      >
                                                         Back
                                                      </button>
                                                   </div>
                                                </div>
                                             ) : (
                                               <div className="flex flex-col gap-2 p-1">
                                                  <div className="flex gap-2">
                                                     <button 
                                                       onClick={() => handleOfferResponseInChat(msg.metadata.offer_id, 'accepted', msg.id)} 
                                                       className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition shadow-sm"
                                                     >
                                                       Accept
                                                     </button>
                                                     <button 
                                                       onClick={() => setOfferCounterForm({ offerId: msg.metadata.offer_id, amount: "" })} 
                                                       className={`flex-1 border py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-sm ${
                                                          isOwn ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' : 'bg-gray-50 text-gray-900 border-gray-200 hover:bg-gray-100'
                                                       }`}
                                                     >
                                                       Counter
                                                     </button>
                                                  </div>
                                                  <button 
                                                     onClick={() => handleOfferResponseInChat(msg.metadata.offer_id, 'declined', msg.id)} 
                                                     className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-sm ${
                                                        isOwn ? 'bg-rose-50/10 text-rose-200 border border-rose-100/20 hover:bg-rose-100/20' : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'
                                                     }`}
                                                  >
                                                     Decline
                                                  </button>
                                               </div>
                                             )}
                                          </div>
                                       )}
                                       {(msg.metadata?.status && msg.metadata.status !== 'pending') && (
                                          <div className={`mt-3 p-2.5 rounded-xl text-center text-[10px] font-black uppercase tracking-widest border ${
                                             msg.metadata.status === 'accepted' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                                             msg.metadata.status === 'countered' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                             'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                          }`}>
                                            Offer {msg.metadata.status} {msg.metadata.status === 'countered' && `(₹${msg.metadata.counter_amount?.toLocaleString()})`}
                                          </div>
                                       )}
                                    </div>
                                 ) : msg.type === 'system_deal' ? (
                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center gap-4 min-w-[280px]">
                                       <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                          <Package className="w-5 h-5 text-emerald-600" />
                                       </div>
                                       <div>
                                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Deal Confirmed</p>
                                          <p className="text-[13px] font-bold text-gray-900">{msg.message}</p>
                                       </div>
                                    </div>
                                 ) : msg.type === 'image' || msg.type === 'video' ? (
                                    <div 
                                      className="relative rounded-xl overflow-hidden cursor-pointer"
                                      onClick={() => setSelectedImage(`${API_BASE_URL}/uploads/${msg.message}`)}
                                    >
                                       {msg.type === 'video' ? (
                                          <div className="relative aspect-video bg-black flex items-center justify-center min-w-[200px]">
                                             <video src={`${API_BASE_URL}/uploads/${msg.message}`} className="max-w-full max-h-[250px] opacity-70" />
                                             <PlayCircle className="absolute w-12 h-12 text-white shadow-2xl" />
                                          </div>
                                       ) : (
                                          <img src={`${API_BASE_URL}/uploads/${msg.message}`} className="max-w-full max-h-[300px] object-cover" />
                                       )}
                                    </div>
                                 ) : (
                                    <p className="text-[14px] leading-relaxed font-medium">{msg.message}</p>
                                 )}

                                 {!isOwn && (
                                   <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5">
                                      {/* subtle background pattern if needed */}
                                   </div>
                                 )}
                              </div>

                              <div className="mt-1.5 flex items-center gap-2 px-1">
                                 <span className="text-[9px] font-black text-gray-300 uppercase tracking-wider">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                                 {isOwn && (
                                    <span className={`text-[10px] ${msg.is_read ? "text-blue-500" : "text-gray-200"}`}>
                                       {msg.is_read ? "✓✓" : "✓"}
                                    </span>
                                 )}
                              </div>
                           </div>
                        </div>
                      </Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* INPUT AREA: FIXED & CLEAN */}
                <div className="p-5 border-t border-gray-100 bg-white">
                   
                   {/* DYNAMIC QUICK REPLIES */}
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
                      {quickReplies.map((reply) => (
                        <button 
                          key={reply.id} 
                          onClick={() => sendQuickMessage(reply.text)}
                          className="whitespace-nowrap px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-transparent rounded-full text-[11px] font-bold text-gray-600 transition-all uppercase tracking-wider"
                        >
                           {reply.text}
                        </button>
                      ))}
                   </div>

                   <form onSubmit={handleSendMessage} className="relative flex items-end gap-3 bg-gray-50 rounded-2xl p-2 pr-4 ring-1 ring-transparent focus-within:ring-blue-100 transition-all focus-within:bg-white">
                      <div className="flex items-center shrink-0 h-[46px]">
                         <button 
                           type="button" 
                           onClick={() => fileInputRef.current?.click()}
                           className={`p-3 text-gray-400 hover:text-gray-900 transition-colors ${uploading ? 'animate-pulse' : ''}`}
                         >
                            <Paperclip className="w-5 h-5" />
                         </button>
                         <input type="file" hidden ref={fileInputRef} onChange={handleMediaUpload} accept="image/*,video/*" />
                      </div>

                      <textarea 
                        rows="1"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={labels.chat_type_placeholder || "Type a message..."}
                        className="w-full bg-transparent border-none outline-none py-3.5 text-[14px] text-gray-800 placeholder:text-gray-400 resize-none max-h-[150px] custom-scrollbar"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                             e.preventDefault();
                             handleSendMessage();
                          }
                        }}
                      />

                      <div className="flex items-center shrink-0 h-[46px]">
                         <button 
                           type="submit" 
                           disabled={!newMessage.trim()}
                           className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100"
                         >
                            <Send className="w-5 h-5 ml-0.5" />
                         </button>
                      </div>
                   </form>
                </div>

              </Fragment>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 lg:p-24 bg-gray-50/20">
                 <div className="w-24 h-24 bg-blue-600/5 rounded-full flex items-center justify-center mb-8 animate-in fade-in zoom-in duration-700">
                    <Send className="w-10 h-10 text-blue-600 transform -rotate-12" />
                 </div>
                 <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-4 uppercase">{labels.chat_empty_state_title || "Marketplace Conversations"}</h3>
                 <p className="text-sm font-medium text-gray-500 max-w-[450px] leading-relaxed mb-10">
                    {labels.chat_empty_state_desc || "Manage your discussions professionally within the collector hub."}
                 </p>
                 <div className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm animate-in slide-in-from-bottom-5 duration-700 delay-200">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                       <Smile className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{labels.chat_encryption_notice || "End-to-end encrypted"}</span>
                 </div>
              </div>
            )}
          </section>

        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* MEDIA VIEWER */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
           <button 
             onClick={() => setSelectedImage(null)} 
             className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110]"
           >
             <X size={24} />
           </button>
           
           {(selectedImage.toLowerCase().endsWith('.mp4') || selectedImage.toLowerCase().endsWith('.mov') || selectedImage.toLowerCase().endsWith('.webm')) ? (
              <video src={selectedImage} controls autoPlay className="max-w-full max-h-[90vh] rounded-xl shadow-2xl" />
           ) : (
              <img src={selectedImage} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" alt="View" />
           )}
        </div>
      )}
      
      {/* DEAL CONFIRMATION MODAL */}
      {showDealModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8">
                 <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Confirm Deal</h3>
                 <p className="text-sm text-gray-500 mb-8 font-medium">Create a formal deal for this watch. This will hide the listing and start the shipment process.</p>
                 
                 <div className="space-y-6">
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">Agreed Price (₹)</label>
                       <input 
                         type="number"
                         value={finalPrice}
                         onChange={(e) => setFinalPrice(e.target.value)}
                         className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-xl font-black outline-none transition-all"
                         placeholder="0.00"
                       />
                    </div>
                    
                    <div className="flex gap-4">
                       <button 
                         onClick={() => setShowDealModal(false)}
                         className="flex-grow py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
                       >
                          Cancel
                       </button>
                       <button 
                         onClick={handleConfirmDirectDeal}
                         className="flex-grow py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                       >
                          Finalize Deal
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500 rounded-2xl shadow-2xl px-8 py-4 flex items-center gap-4 bg-white border border-gray-100`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === "error" ? "bg-red-50" : "bg-emerald-50"}`}>
             {toast.type === "error" ? (
                <X className="w-4 h-4 text-red-600" />
             ) : (
                <Send className="w-4 h-4 text-emerald-600" />
             )}
          </div>
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">{toast.message}</p>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
