const fs = require('fs');
const path = require('path');

const newContent = `

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";
import { getCategories, createProduct, updateProduct, API_URL, API_BASE_URL, getUserProfile } from "../../services/api";
import { Camera, X, Upload } from "lucide-react";
import ProfileOnboardingModal from "../../components/ProfileOnboardingModal";
import Breadcrumbs from "../../components/Breadcrumbs";

export default function SellPage() {
   const [categories, setCategories] = useState([]);
   const [loading, setLoading] = useState(false);
   const [initLoading, setInitLoading] = useState(true);
   const [showSuccess, setShowSuccess] = useState({ show: false, message: "", type: "pending", autoApproved: false });
   const [toast, setToast] = useState(null);
   const [productStatus, setProductStatus] = useState(null);
   const [rejectionReason, setRejectionReason] = useState(null);
   const [showOnboarding, setShowOnboarding] = useState(false);
   const [currentUser, setCurrentUser] = useState(null);
   const [errors, setErrors] = useState({});
   const router = useRouter();

   const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4500);
   };

   const [formData, setFormData] = useState({
      title: "",
      description: "",
      price: "",
      category_id: "",
      product_type: "fixed",
      condition_code: "",
      item_specifics: {},
      condition_details: {},
      shipping_info: {
         method: "Express Hub Shipping",
         carrier: "FedEx",
         days: "3-5",
         packaging: "Standard Watch Box",
         price: "0"
      },
      payment_info: {
         accepted: ["Hub Wallet", "Stripe", "Bank Transfer"]
      },
      allow_offers: false,
      allow_buy_now: false,
      buy_it_now_price: "",
      allow_auction: false,
      starting_bid: "",
      auction_end: "",
      reserve_price: "",
      auction_duration: "3",
      shipping_fee: "",
      shipping_type: "fixed",
      shipping_scope: "LOCAL"
   });

   const [images, setImages] = useState([]);
   const [previews, setPreviews] = useState([]);
   const [showCamera, setShowCamera] = useState(false);
   const [cameraStream, setCameraStream] = useState(null);
   const [isRecording, setIsRecording] = useState(false);
   const [recordingTime, setRecordingTime] = useState(0);
   const videoRef = useRef(null);
   const canvasRef = useRef(null);
   const mediaRecorderRef = useRef(null);
   const recordedChunksRef = useRef([]);
   const [isDragging, setIsDragging] = useState(false);
   const [videoSettings, setVideoSettings] = useState({});
   const [draggedIdx, setDraggedIdx] = useState(null);

   const handleItemDragStart = (idx) => setDraggedIdx(idx);
   const handleItemDragOver = (e) => e.preventDefault();
   const handleItemDrop = (targetIdx) => {
      if (draggedIdx === null || draggedIdx === targetIdx) return;
      const newPreviews = [...previews];
      const [draggedItem] = newPreviews.splice(draggedIdx, 1);
      newPreviews.splice(targetIdx, 0, draggedItem);
      setPreviews(newPreviews);
      const newFiles = newPreviews.filter(p => !p.isExisting).map(p => p.file);
      setImages(newFiles);
      setDraggedIdx(null);
   };

   useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");
      const user = localStorage.getItem("user");
      
      if (!user) {
         router.push("/login?redirect=/sell");
         return;
      }

      if (editId) {
         fetch(\`\${API_URL}/products/\${editId}\`)
            .then(res => res.json())
            .then(data => {
               setFormData({
                  title: data.title || "",
                  description: data.description || "",
                  price: data.price ? data.price.toString() : "",
                  category_id: data.category_id ? data.category_id.toString() : "",
                  product_type: data.product_type || "fixed",
                  condition_code: data.condition_code || "",
                  item_specifics: data.item_specifics || {},
                  condition_details: data.condition_details || {},
                  shipping_info: data.shipping_info || {
                     method: "Express Hub Shipping",
                     carrier: "FedEx",
                     days: "3-5",
                     packaging: "Standard Watch Box",
                     price: "0"
                  },
                  payment_info: data.payment_info || {
                     accepted: ["Hub Wallet", "Stripe", "Bank Transfer"]
                  },
                  allow_offers: data.allow_offers || false,
                  allow_buy_now: data.allow_buy_now || false,
                  buy_it_now_price: data.buy_it_now_price ? data.buy_it_now_price.toString() : "",
                  allow_auction: data.allow_auction || false,
                  starting_bid: data.starting_bid ? data.starting_bid.toString() : "",
                  auction_end: data.auction_end || "",
                  reserve_price: data.reserve_price ? data.reserve_price.toString() : "",
                  auction_duration: data.auction_duration || "3",
                  shipping_fee: data.shipping_fee ? data.shipping_fee.toString() : "",
                  shipping_type: data.shipping_type || "fixed",
                  shipping_scope: data.shipping_scope || "LOCAL"
               });
               if (data.status) setProductStatus(data.status);
               if (data.rejection_reason) setRejectionReason(data.rejection_reason);
               if (data.images) {
                  setPreviews(data.images.map(img => ({
                     url: img.startsWith('http') ? img : \`\${API_BASE_URL}/uploads/\${img}\`,
                     path: img,
                     type: img.match(/\\.(mp4|mov|webm|quicktime|avi|mkv)$/i) ? 'video' : 'image',
                     isExisting: true,
                     muted: data.video_settings && data.video_settings[img] ? data.video_settings[img].muted : false
                  })));
                  if (data.video_settings) setVideoSettings(data.video_settings);
               }
            });
      }

      const parsedUser = user ? JSON.parse(user) : null;
      const userId = parsedUser?.id || parsedUser?._id;
      if (userId) {
         getUserProfile(userId)
           .then(data => {
              if (data && data.id) {
                 setCurrentUser(data);
                 if (!data.address || !data.city || !data.phone) {
                    setShowOnboarding(true);
                 }
              }
           })
           .catch(err => console.error("Profile fetch error:", err));
      }

      getCategories().then((data) => {
         setCategories(data);
         setInitLoading(false);
      }).catch(console.error);
   }, [router]);

   useEffect(() => {
      if (showCamera && cameraStream && videoRef.current) {
         videoRef.current.srcObject = cameraStream;
      }
   }, [showCamera, cameraStream]);

   useEffect(() => {
      let interval;
      if (isRecording) {
         interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      } else {
         setRecordingTime(0);
      }
      return () => clearInterval(interval);
   }, [isRecording]);

   const selectedCategory = useMemo(() =>
      categories.find(c => c.id === parseInt(formData.category_id)),
      [categories, formData.category_id]);

   const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      if (name === "price" || name === "buy_it_now_price" || name === "starting_bid" || name === "reserve_price" || name === "shipping_fee") {
         const cleanValue = value.replace(/[^0-9.]/g, '');
         const parts = cleanValue.split('.');
         if (parts.length > 2) return;
         setFormData(prev => ({ ...prev, [name]: cleanValue }));
         if (errors[name]) setErrors(prev => ({...prev, [name]: null}));
         return;
      }
      
      if (type === "checkbox") {
         const selectedOptions = [
            name === 'allow_buy_now' ? checked : formData.allow_buy_now,
            name === 'allow_auction' ? checked : formData.allow_auction,
            name === 'allow_offers' ? checked : formData.allow_offers
         ].filter(Boolean).length;

         if (selectedOptions > 2) {
            showToast("Max 2 listing options allowed.", 'error');
            return;
         }
         setFormData(prev => ({ ...prev, [name]: checked }));
         if (errors.pricing) setErrors(prev => ({...prev, pricing: null}));
         return;
      }

      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({...prev, [name]: null}));
   };

   const handleNestedChange = (parent, field, value) => {
      setFormData(prev => ({
         ...prev,
         [parent]: { ...prev[parent], [field]: value }
      }));
   };

   const handleShippingToggle = (type) => {
      setFormData(prev => ({
         ...prev,
         shipping_type: prev.shipping_type === type ? "fixed" : type,
         shipping_fee: type === "fixed" ? prev.shipping_fee : ""
      }));
   };

   const handleFiles = (files) => {
      if (previews.length + files.length > 20) {
         showToast("Maximum 20 media files allowed.", 'error');
         return;
      }
      const newPreviews = files.map(f => ({
         url: URL.createObjectURL(f),
         type: f.type.startsWith('video') ? 'video' : 'image',
         isExisting: false,
         file: f,
         muted: false
      }));
      setImages(prev => [...prev, ...files]);
      setPreviews(prev => [...prev, ...newPreviews]);
      if (errors.media) setErrors(prev => ({...prev, media: null}));
   };

   const handleMediaChange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) handleFiles(files);
   };

   const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
   const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
   const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
   const handleDrop = (e) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) handleFiles(files);
   };

   const removeMedia = (idx) => {
      const itemToRemove = previews[idx];
      if (itemToRemove && !itemToRemove.isExisting) {
         const fileIdx = previews.slice(0, idx).filter(p => !p.isExisting).length;
         setImages(prev => prev.filter((_, i) => i !== fileIdx));
      }
      setPreviews(prev => prev.filter((_, i) => i !== idx));
   };

   const startCamera = async () => {
      try {
         const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }, 
            audio: true 
         });
         setCameraStream(stream);
         setShowCamera(true);
      } catch (err) {
         showToast("Camera access denied.", 'error');
         console.error(err);
      }
   };

   const stopCamera = () => {
      if (cameraStream) {
         cameraStream.getTracks().forEach(track => track.stop());
         setCameraStream(null);
      }
      setShowCamera(false);
   };

   const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
         const video = videoRef.current;
         const canvas = canvasRef.current;
         canvas.width = video.videoWidth;
         canvas.height = video.videoHeight;
         const ctx = canvas.getContext('2d');
         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
         const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
         fetch(dataUrl).then(res => res.blob()).then(blob => {
            const file = new File([blob], \`live_photo_\${Date.now()}.jpg\`, { type: 'image/jpeg' });
            setImages(prev => [...prev, file]);
            setPreviews(prev => [...prev, { url: dataUrl, type: 'image' }]);
            stopCamera();
            if (errors.media) setErrors(prev => ({...prev, media: null}));
         });
      }
   };

   const startRecording = () => {
      if (!cameraStream) return;
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) options.mimeType = 'video/webm';
      const mediaRecorder = new MediaRecorder(cameraStream, options);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
         const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
         const url = URL.createObjectURL(blob);
         const file = new File([blob], \`live_video_\${Date.now()}.webm\`, { type: 'video/webm' });
         setImages(prev => [...prev, file]);
         setPreviews(prev => [...prev, { url, type: 'video' }]);
         stopCamera();
         if (errors.media) setErrors(prev => ({...prev, media: null}));
      };
      mediaRecorder.start();
      setIsRecording(true);
      setTimeout(() => { if (mediaRecorder.state === "recording") stopRecording(); }, 20000);
   };

   const stopRecording = () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
         mediaRecorderRef.current.stop();
         setIsRecording(false);
      }
   };

   const validateForm = () => {
      const newErrors = {};
      if (!formData.title) newErrors.title = "Title is required";
      if (!formData.category_id) newErrors.category_id = "Category is required";
      if (!formData.condition_code) newErrors.condition_code = "Condition is required";
      
      if (!formData.allow_buy_now && !formData.allow_auction && !formData.allow_offers) {
         newErrors.pricing = "Select at least one pricing format";
      }
      if (formData.allow_buy_now && !formData.buy_it_now_price) {
         newErrors.buy_it_now_price = "Buy It Now price is required";
      }
      if (formData.allow_auction && (!formData.starting_bid || !formData.auction_duration)) {
         newErrors.auction = "Auction starting bid and duration are required";
      }
      if (previews.length === 0) {
         newErrors.media = "At least one photo or video is required";
      }
      if (formData.shipping_type === 'fixed' && !formData.shipping_fee) {
         newErrors.shipping_fee = "Shipping fee is required";
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
         showToast("Please fill all required fields.", "error");
         window.scrollTo({ top: 0, behavior: 'smooth' });
         return false;
      }
      return true;
   };

   const handleSubmit = async (type = 'pending') => {
      if (type === 'pending' && !validateForm()) return;
      
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");

      try {
         const user = JSON.parse(localStorage.getItem("user"));
         const finalData = new FormData();

         finalData.append("title", formData.title);
         finalData.append("description", formData.description);
         const mainPrice = formData.allow_auction ? formData.starting_bid : (formData.allow_buy_now ? formData.buy_it_now_price : 0);
         finalData.append("price", String(mainPrice));
         finalData.append("category_id", formData.category_id);
         finalData.append("product_type", formData.product_type);
         finalData.append("seller_id", user.id);
         finalData.append("status", type);
         finalData.append("condition_code", formData.condition_code);
         finalData.append("item_specifics", JSON.stringify(formData.item_specifics));
         finalData.append("condition_details", JSON.stringify(formData.condition_details));
         finalData.append("shipping_info", JSON.stringify(formData.shipping_info));
         finalData.append("payment_info", JSON.stringify(formData.payment_info));
         finalData.append("allow_offers", String(formData.allow_offers));
         finalData.append("allow_buy_now", String(formData.allow_buy_now));
         finalData.append("buy_it_now_price", String(formData.buy_it_now_price || 0));
         finalData.append("allow_auction", String(formData.allow_auction));
         finalData.append("starting_bid", String(formData.starting_bid || 0));
         finalData.append("reserve_price", String(formData.reserve_price || 0));
         
         if (formData.allow_auction && !editId) {
            const durationDays = parseInt(formData.auction_duration || "3");
            const endTime = new Date();
            endTime.setDate(endTime.getDate() + durationDays);
            finalData.append("auction_end", endTime.toISOString());
         } else {
            finalData.append("auction_end", formData.auction_end || "");
         }

         finalData.append("shipping_fee", String(formData.shipping_fee || 0));
         finalData.append("shipping_type", formData.shipping_type);
         finalData.append("shipping_scope", formData.shipping_scope);

         images.forEach(img => finalData.append("images", img));
         const existingImages = previews.filter(p => p.isExisting).map(p => p.path);
         finalData.append("existing_images", JSON.stringify(existingImages));
         const mediaOrder = previews.map(p => p.isExisting ? p.path : p.file?.name);
         finalData.append("media_order", JSON.stringify(mediaOrder));

         const videoSettingsMap = {};
         previews.forEach(p => {
            if (p.type === 'video' && p.muted) {
               const key = p.isExisting ? p.path : (p.file?.name);
               if (key) videoSettingsMap[key] = { muted: true };
            }
         });
         finalData.append("video_settings", JSON.stringify(videoSettingsMap));

         let res;
         if (editId) {
            if (productStatus === 'approved' && type === 'pending') {
               finalData.set("status", "approved");
            }
            res = await updateProduct(editId, finalData);
         } else {
            res = await createProduct(finalData);
         }

         if (res.product || res.message === "Product updated successfully" || res.message === "Listing successfully created") {
            const autoApproved = res.product?.status === 'approved' && type !== 'draft';
            const msg = type === 'draft' ? "Saved as Draft!" : (editId ? "Listing Updated!" : "Watch Listed!");
            setShowSuccess({ show: true, message: msg, type, autoApproved });
            setTimeout(() => { router.push("/"); }, 3200);
         } else {
            showToast(res.message || "Failed to process listing.", 'error');
         }
      } catch (err) {
         console.error(err);
         showToast("System error during listing. Please try again.", 'error');
      } finally {
         setLoading(false);
      }
   };

   const handleOnboardingComplete = (updatedUser) => {
      setCurrentUser(updatedUser);
      localStorage.setItem("user", JSON.stringify({...JSON.parse(localStorage.getItem("user")), ...updatedUser}));
      setShowOnboarding(false);
   };

   if (initLoading) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
         <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
         <p className="font-black text-xs uppercase tracking-[0.5em] text-blue-600 ml-2">Loading Hub...</p>
      </div>
   );

   return (
      <div className="bg-background min-h-screen pb-20 font-sans text-foreground">
         <ProfileOnboardingModal isOpen={showOnboarding} onClose={() => router.push('/')} user={currentUser} onComplete={handleOnboardingComplete} />
         
         {/* Success Modal */}
         {showSuccess.show && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-surface/96 backdrop-blur-md">
               <div className="flex flex-col items-center text-center px-8">
                  <h2 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight mb-4">{showSuccess.message}</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">Redirecting...</p>
               </div>
            </div>
         )}

         {toast && (
            <div className={\`fixed bottom-6 right-6 z-[4000] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-[11px] font-black uppercase tracking-widest \${toast.type === 'error' ? 'bg-rose-500 shadow-rose-200' : 'bg-emerald-500 shadow-emerald-200'}\`}>
               <span className="leading-tight normal-case font-bold text-[12px] tracking-normal">{toast.message}</span>
            </div>
         )}

         <Navbar />

         {/* Camera Overlay */}
         {showCamera && (
            <div className="fixed inset-0 z-[5000] bg-black/90 flex flex-col items-center justify-center">
               <video ref={videoRef} autoPlay playsInline muted className="max-w-full max-h-[70vh] rounded-lg" />
               <canvas ref={canvasRef} className="hidden" />
               <div className="flex gap-4 mt-8">
                  <button onClick={capturePhoto} className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-gray-200">Capture Photo</button>
                  {isRecording ? (
                     <button onClick={stopRecording} className="bg-rose-600 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest animate-pulse">Stop Video ({recordingTime}s)</button>
                  ) : (
                     <button onClick={startRecording} className="bg-rose-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-rose-600">Start Video</button>
                  )}
                  <button onClick={stopCamera} className="bg-gray-800 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-gray-700">Cancel</button>
               </div>
            </div>
         )}

         <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <div className="mb-8 flex justify-center">
               <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Consign Asset' }]} />
            </div>

            <div className="mb-10 text-center">
               <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900">Consign Your Asset</h1>
               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Complete the form below to list on the Hub</p>
            </div>

            {productStatus === 'rejected' && rejectionReason && (
               <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2">Listing Rejected</p>
                  <p className="text-[13px] text-rose-700 font-bold leading-relaxed">{rejectionReason}</p>
               </div>
            )}

            <div className="space-y-10">
               
               {/* STEP 1: BASICS */}
               <section className="bg-surface border border-gray-200 shadow-sm p-6 sm:p-10 rounded-2xl">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6">1. Basics</h2>
                  
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Listing Title <span className="text-rose-500">*</span></label>
                        <input
                           type="text"
                           name="title"
                           value={formData.title}
                           onChange={handleInputChange}
                           placeholder="e.g. Omega Seamaster 300 Heritage 2021"
                           className={\`w-full bg-background border \${errors.title ? 'border-rose-500' : 'border-gray-200'} p-5 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all font-semibold text-gray-900 text-lg placeholder:text-gray-400\`}
                        />
                        {errors.title && <p className="text-rose-500 text-xs font-bold px-1">{errors.title}</p>}
                     </div>

                     <div className="space-y-4">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Select Category <span className="text-rose-500">*</span></label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {categories.map(c => (
                              <button
                                 key={c.id}
                                 onClick={() => {
                                    handleInputChange({ target: { name: 'category_id', value: c.id.toString() } });
                                    if(errors.category_id) setErrors(prev => ({...prev, category_id: null}));
                                 }}
                                 className={\`p-4 rounded-xl border transition-all text-center \${formData.category_id === c.id.toString() ? 'border-blue-600 bg-blue-50/50 shadow-sm' : (errors.category_id ? 'border-rose-300 bg-rose-50' : 'border-gray-200 bg-background hover:bg-gray-50')}\`}
                              >
                                 <p className={\`text-[12px] font-bold uppercase tracking-widest \${formData.category_id === c.id.toString() ? 'text-blue-600' : 'text-gray-700'}\`}>{c.name}</p>
                              </button>
                           ))}
                        </div>
                        {errors.category_id && <p className="text-rose-500 text-xs font-bold px-1">{errors.category_id}</p>}
                     </div>
                  </div>
               </section>

               {/* STEP 2: CONDITION */}
               <section className="bg-surface border border-gray-200 shadow-sm p-6 sm:p-10 rounded-2xl">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6">2. Condition</h2>
                  
                  <div className="space-y-8">
                     <div className="space-y-4">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Condition Grade <span className="text-rose-500">*</span></label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           {[
                              { c: "excellent", l: "Excellent", d: "Near mint, minimal wear" },
                              { c: "good", l: "Good", d: "Minor scratches, daily wear" },
                              { c: "fair", l: "Fair", d: "Visible wear, needs polish" },
                              { c: "not_working", l: "Spares", d: "Not running, parts only" }
                           ].map(c => (
                              <button
                                 key={c.c}
                                 onClick={() => {
                                    handleInputChange({ target: { name: 'condition_code', value: c.c } });
                                    if(errors.condition_code) setErrors(prev => ({...prev, condition_code: null}));
                                 }}
                                 className={\`p-5 rounded-xl border text-left transition-all \${formData.condition_code === c.c ? 'border-blue-600 bg-blue-50/50' : (errors.condition_code ? 'border-rose-300 bg-rose-50' : 'border-gray-200 bg-background hover:bg-gray-50')}\`}
                              >
                                 <p className="text-[13px] font-bold text-gray-900">{c.l}</p>
                                 <p className="text-[10px] font-medium text-gray-500 mt-1">{c.d}</p>
                              </button>
                           ))}
                        </div>
                        {errors.condition_code && <p className="text-rose-500 text-xs font-bold px-1">{errors.condition_code}</p>}
                     </div>

                     {selectedCategory?.conditions?.length > 0 && (
                        <div className="space-y-4">
                           <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Technical Condition Specs</label>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedCategory.conditions.map(cf => {
                                 const isManual = formData.condition_details[\`\${cf.field_name}_manual_mode\`];
                                 return (
                                    <div key={cf.id} className="p-5 bg-background border border-gray-200 rounded-xl space-y-3">
                                       <div className="flex justify-between items-center">
                                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{cf.field_label}</p>
                                          <button 
                                             onClick={() => handleNestedChange('condition_details', \`\${cf.field_name}_manual_mode\`, !isManual)}
                                             className="text-[9px] font-bold text-blue-500 uppercase hover:underline"
                                          >
                                             {isManual ? "List View" : "Manual Input"}
                                          </button>
                                       </div>
                                       
                                       {isManual ? (
                                          <input
                                             type="text"
                                             onChange={(e) => handleNestedChange('condition_details', cf.field_name, e.target.value)}
                                             value={formData.condition_details[cf.field_name] || ""}
                                             className="w-full bg-surface border border-gray-200 p-3 rounded-lg font-bold text-xs text-gray-900 outline-none focus:border-blue-600"
                                             placeholder={\`Describe \${cf.field_label}\`}
                                          />
                                       ) : (
                                          <select
                                             onChange={(e) => handleNestedChange('condition_details', cf.field_name, e.target.value)}
                                             value={formData.condition_details[cf.field_name] || ""}
                                             className="w-full bg-surface border border-gray-200 p-3 rounded-lg font-bold text-xs text-gray-900 outline-none focus:border-blue-600"
                                          >
                                             <option value="">Select Status</option>
                                             {cf.options.map(o => <option key={o} value={o}>{o}</option>)}
                                          </select>
                                       )}
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     )}
                  </div>
               </section>

               {/* STEP 3: MEDIA */}
               <section className="bg-surface border border-gray-200 shadow-sm p-6 sm:p-10 rounded-2xl">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6">3. Media <span className="text-rose-500">*</span></h2>
                  
                  <div className="space-y-6">
                     <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Upload photos and at least one video (Max 20)</p>
                     
                     <div 
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={\`border-2 border-dashed rounded-xl p-10 text-center transition-all \${isDragging ? 'border-blue-600 bg-blue-50' : (errors.media ? 'border-rose-400 bg-rose-50' : 'border-gray-300 bg-background hover:bg-gray-50')}\`}
                     >
                        <input type="file" multiple accept="image/*,video/*" onChange={handleMediaChange} className="hidden" id="media-upload" />
                        <div className="flex flex-col items-center justify-center gap-4">
                           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                              <Upload className="w-8 h-8" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-gray-900">Drag & drop your files here</p>
                              <p className="text-xs text-gray-500 mt-1">or click to browse</p>
                           </div>
                           <div className="flex flex-wrap justify-center gap-4 mt-4">
                              <label htmlFor="media-upload" className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">
                                 Browse Files
                              </label>
                              <button onClick={startCamera} className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2">
                                 <Camera className="w-4 h-4" /> Use Camera
                              </button>
                           </div>
                        </div>
                     </div>
                     {errors.media && <p className="text-rose-500 text-xs font-bold">{errors.media}</p>}

                     {previews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                           {previews.map((p, idx) => (
                              <div key={idx} draggable onDragStart={() => handleItemDragStart(idx)} onDragOver={handleItemDragOver} onDrop={() => handleItemDrop(idx)} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group cursor-move">
                                 {p.type === 'video' ? (
                                    <video src={p.url || p} className="w-full h-full object-cover" />
                                 ) : (
                                    <img src={p.url || p} className="w-full h-full object-cover" />
                                 )}
                                 <button onClick={(e) => { e.preventDefault(); removeMedia(idx); }} className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </section>

               {/* STEP 4: SPECS */}
               <section className="bg-surface border border-gray-200 shadow-sm p-6 sm:p-10 rounded-2xl">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6">4. Specifications</h2>
                  
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Item Description</label>
                        <textarea
                           name="description"
                           value={formData.description}
                           onChange={handleInputChange}
                           rows={5}
                           placeholder="Add a detailed description about your item..."
                           className="w-full bg-background border border-gray-200 p-5 rounded-xl focus:border-blue-600 outline-none transition-all font-medium text-gray-900 text-sm placeholder:text-gray-400 resize-none"
                        />
                     </div>

                     {selectedCategory?.specs?.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                           {selectedCategory.specs.map(s => {
                              const isManual = formData.item_specifics[\`\${s.field_name}_manual_mode\`];
                              return (
                                 <div key={s.id} className="space-y-3 bg-background p-5 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-center">
                                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.field_label} {s.is_required && "*"}</label>
                                       <button 
                                          onClick={() => handleNestedChange('item_specifics', \`\${s.field_name}_manual_mode\`, !isManual)}
                                          className="text-[9px] font-bold text-blue-500 uppercase tracking-tight hover:underline"
                                       >
                                          {isManual ? "Back to List" : "Manual Entry"}
                                       </button>
                                    </div>
                                    
                                    {isManual ? (
                                       <input
                                          type="text"
                                          onChange={(e) => handleNestedChange('item_specifics', s.field_name, e.target.value)}
                                          value={formData.item_specifics[s.field_name] || ""}
                                          className="w-full bg-surface border border-gray-200 p-4 rounded-lg font-bold text-xs text-gray-900 outline-none focus:border-blue-600"
                                          placeholder={\`Enter Custom \${s.field_label}\`}
                                       />
                                    ) : (
                                       s.field_type === 'select' ? (
                                          <select
                                             onChange={(e) => handleNestedChange('item_specifics', s.field_name, e.target.value)}
                                             value={formData.item_specifics[s.field_name] || ""}
                                             className="w-full bg-surface border border-gray-200 p-4 rounded-lg font-bold text-xs text-gray-900 outline-none focus:border-blue-600"
                                          >
                                             <option value="">Select Option</option>
                                             {s.options.map(o => <option key={o} value={o}>{o}</option>)}
                                          </select>
                                       ) : (
                                          <input
                                             type={s.field_type}
                                             onChange={(e) => handleNestedChange('item_specifics', s.field_name, e.target.value)}
                                             value={formData.item_specifics[s.field_name] || ""}
                                             className="w-full bg-surface border border-gray-200 p-4 rounded-lg font-bold text-xs text-gray-900 outline-none focus:border-blue-600"
                                             placeholder={\`e.g. \${s.field_label}\`}
                                          />
                                       )
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     )}
                  </div>
               </section>

               {/* STEP 5: PRICING & SHIPPING */}
               <section className="bg-surface border border-gray-200 shadow-sm p-6 sm:p-10 rounded-2xl">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6">5. Pricing & Shipping <span className="text-rose-500">*</span></h2>
                  
                  <div className="space-y-10">
                     <div className={\`p-6 border-2 rounded-2xl \${errors.pricing ? 'border-rose-400 bg-rose-50' : 'border-gray-100'}\`}>
                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-6">Listing Formats (Select at least 1) <span className="text-rose-500">*</span></h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <label className={\`p-6 rounded-xl border-2 cursor-pointer transition-all \${formData.allow_buy_now ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}\`}>
                              <div className="flex items-center justify-between mb-4">
                                 <span className="text-sm font-black uppercase tracking-widest text-gray-900">Buy It Now</span>
                                 <input type="checkbox" name="allow_buy_now" checked={formData.allow_buy_now} onChange={handleInputChange} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
                              </div>
                              {formData.allow_buy_now && (
                                 <div className="space-y-2 mt-4">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fixed Price (₹)</p>
                                    <input type="text" name="buy_it_now_price" value={formData.buy_it_now_price} onChange={handleInputChange} placeholder="0.00" className={\`w-full bg-background border \${errors.buy_it_now_price ? 'border-rose-500' : 'border-gray-300'} p-3 rounded-lg font-bold text-lg outline-none focus:border-blue-600\`} />
                                    {errors.buy_it_now_price && <p className="text-rose-500 text-xs font-bold">{errors.buy_it_now_price}</p>}
                                 </div>
                              )}
                           </label>

                           <label className={\`p-6 rounded-xl border-2 cursor-pointer transition-all \${formData.allow_auction ? 'border-amber-500 bg-amber-50/50' : 'border-gray-200 hover:border-gray-300'}\`}>
                              <div className="flex items-center justify-between mb-4">
                                 <span className="text-sm font-black uppercase tracking-widest text-gray-900">Auction</span>
                                 <input type="checkbox" name="allow_auction" checked={formData.allow_auction} onChange={handleInputChange} className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"/>
                              </div>
                              {formData.allow_auction && (
                                 <div className="space-y-4 mt-4">
                                    <div>
                                       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Starting Bid (₹)</p>
                                       <input type="text" name="starting_bid" value={formData.starting_bid} onChange={handleInputChange} placeholder="0.00" className="w-full bg-background border border-gray-300 p-3 rounded-lg font-bold text-lg outline-none focus:border-amber-500"/>
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reserve Price (₹) - Optional</p>
                                       <input type="text" name="reserve_price" value={formData.reserve_price} onChange={handleInputChange} placeholder="0.00" className="w-full bg-background border border-gray-300 p-3 rounded-lg font-bold text-lg outline-none focus:border-amber-500"/>
                                    </div>
                                    <div>
                                       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Duration</p>
                                       <select name="auction_duration" value={formData.auction_duration} onChange={handleInputChange} className="w-full bg-background border border-gray-300 p-3 rounded-lg font-bold text-xs outline-none focus:border-amber-500">
                                          <option value="1">1 Day</option><option value="3">3 Days</option><option value="5">5 Days</option><option value="7">7 Days</option>
                                       </select>
                                    </div>
                                    {errors.auction && <p className="text-rose-500 text-xs font-bold">{errors.auction}</p>}
                                 </div>
                              )}
                           </label>

                           <label className={\`p-6 rounded-xl border-2 cursor-pointer transition-all \${formData.allow_offers ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'}\`}>
                              <div className="flex items-center justify-between mb-4">
                                 <span className="text-sm font-black uppercase tracking-widest text-gray-900">Accept Offers</span>
                                 <input type="checkbox" name="allow_offers" checked={formData.allow_offers} onChange={handleInputChange} className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"/>
                              </div>
                              <p className="text-[10px] font-medium text-gray-500 mt-2">Allow buyers to send offers.</p>
                           </label>
                        </div>
                        {errors.pricing && <p className="text-rose-500 text-xs font-bold mt-4">{errors.pricing}</p>}
                     </div>

                     {/* Shipping */}
                     <div className="space-y-6">
                        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Shipping Configuration</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <label className={\`p-4 rounded-xl border-2 cursor-pointer transition-all \${formData.shipping_scope === 'LOCAL' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200'}\`}>
                              <div className="flex items-start gap-3">
                                 <input type="radio" name="shipping_scope" value="LOCAL" checked={formData.shipping_scope === 'LOCAL'} onChange={handleInputChange} className="mt-1 w-4 h-4 text-blue-600"/>
                                 <div>
                                    <span className="block text-sm font-black uppercase tracking-widest text-gray-900">Local State Only</span>
                                    <span className="block text-[10px] text-gray-500 mt-1">Sell within your state (No GST required).</span>
                                 </div>
                              </div>
                           </label>
                           <label className={\`p-4 rounded-xl border-2 cursor-pointer transition-all \${formData.shipping_scope === 'PAN_INDIA' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200'} \${!currentUser?.gst_number ? 'opacity-50 grayscale' : ''}\`}>
                              <div className="flex items-start gap-3">
                                 <input type="radio" name="shipping_scope" value="PAN_INDIA" checked={formData.shipping_scope === 'PAN_INDIA'} disabled={!currentUser?.gst_number} onChange={(e) => { if (!currentUser?.gst_number) { showToast("GST Number required for Pan-India.", 'error'); return; } handleInputChange(e); }} className="mt-1 w-4 h-4 text-blue-600"/>
                                 <div>
                                    <span className="block text-sm font-black uppercase tracking-widest text-gray-900">Pan-India (Global)</span>
                                    <span className="block text-[10px] text-gray-500 mt-1">Requires verified GST Number.</span>
                                 </div>
                              </div>
                           </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                           <div className={\`col-span-1 p-5 rounded-xl border-2 \${formData.shipping_type === 'fixed' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200'}\`}>
                              <div className="flex items-center gap-2 mb-3">
                                 <input type="radio" name="shipping_type" value="fixed" checked={formData.shipping_type === 'fixed'} onChange={() => handleShippingToggle('fixed')} className="w-4 h-4"/>
                                 <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">Fixed Fee</span>
                              </div>
                              {formData.shipping_type === 'fixed' && (
                                 <div>
                                    <input type="text" name="shipping_fee" value={formData.shipping_fee} onChange={handleInputChange} placeholder="Fee amount (₹)" className={\`w-full p-2 bg-background border-b-2 \${errors.shipping_fee ? 'border-rose-500' : 'border-gray-300'} focus:border-blue-600 outline-none font-bold\`} />
                                    {errors.shipping_fee && <p className="text-rose-500 text-xs font-bold mt-1">{errors.shipping_fee}</p>}
                                 </div>
                              )}
                           </div>
                           <label className={\`col-span-1 p-5 rounded-xl border-2 cursor-pointer flex items-center gap-3 \${formData.shipping_type === 'free' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}\`}>
                              <input type="radio" name="shipping_type" value="free" checked={formData.shipping_type === 'free'} onChange={() => handleShippingToggle('free')} className="w-4 h-4"/>
                              <div>
                                 <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Free Shipping</p>
                                 <p className="text-[9px] text-gray-500">Seller covers costs</p>
                              </div>
                           </label>
                           <label className={\`col-span-1 p-5 rounded-xl border-2 cursor-pointer flex items-center gap-3 \${formData.shipping_type === 'contact' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}\`}>
                              <input type="radio" name="shipping_type" value="contact" checked={formData.shipping_type === 'contact'} onChange={() => handleShippingToggle('contact')} className="w-4 h-4"/>
                              <div>
                                 <p className="text-[11px] font-black uppercase tracking-widest text-gray-900">Contact Quote</p>
                                 <p className="text-[9px] text-gray-500">Decide after deal</p>
                              </div>
                           </label>
                        </div>
                     </div>
                  </div>
               </section>

               {/* Submission Actions */}
               <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 pb-20">
                  <button onClick={() => handleSubmit('draft')} disabled={loading} className="text-[11px] font-bold text-gray-500 hover:text-gray-900 uppercase tracking-widest px-6 py-4 rounded-xl border border-gray-200 bg-surface hover:bg-gray-50 transition-all w-full md:w-auto">
                     Save as Draft
                  </button>
                  <button
                     onClick={() => handleSubmit('pending')}
                     disabled={loading}
                     className="bg-blue-600 text-white px-12 py-4 rounded-xl font-black text-[13px] uppercase tracking-[0.1em] hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 w-full md:w-auto flex items-center justify-center gap-2"
                  >
                     {loading ? 'Processing...' : 'Submit Listing'}
                  </button>
               </div>

            </div>
         </main>
      </div>
   );
}
`;

fs.writeFileSync(path.join(__dirname, '../app/sell/page.tsx'), newContent);
console.log("Successfully rewrote page.tsx");
