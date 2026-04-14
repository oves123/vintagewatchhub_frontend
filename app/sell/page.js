"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";
import { getCategories, createProduct, updateProduct, API_URL, API_BASE_URL } from "../../services/api";
import { Camera, RefreshCw, X, Circle } from "lucide-react";
import "./sell.css";

export default function SellPage() {
   const [step, setStep] = useState(1);
   const [categories, setCategories] = useState([]);
   const [loading, setLoading] = useState(false);
   const [initLoading, setInitLoading] = useState(true);
   const [showSuccess, setShowSuccess] = useState({ show: false, message: "" });
   const [productStatus, setProductStatus] = useState(null);
   const [rejectionReason, setRejectionReason] = useState(null);
   const router = useRouter();

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
      shipping_fee: "",
      shipping_type: "fixed"
   });

   const [images, setImages] = useState([]);
   const [previews, setPreviews] = useState([]);
   const [showCamera, setShowCamera] = useState(false);
   const [cameraStream, setCameraStream] = useState(null);
   const [cameraMode, setCameraMode] = useState('photo'); // 'photo' or 'video'
   const [isRecording, setIsRecording] = useState(false);
   const [recordingTime, setRecordingTime] = useState(0);
   const videoRef = useRef(null);
   const canvasRef = useRef(null);
   const mediaRecorderRef = useRef(null);
   const recordedChunksRef = useRef([]);

   useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");

      const user = localStorage.getItem("user");
      if (!user) {
         router.push("/login?redirect=/sell");
         return;
      }

      if (editId) {
         fetch(`${API_URL}/products/${editId}`)
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
                  shipping_fee: data.shipping_fee ? data.shipping_fee.toString() : "",
                  shipping_type: data.shipping_type || "fixed"
               });
               if (data.status) setProductStatus(data.status);
               if (data.rejection_reason) setRejectionReason(data.rejection_reason);
               if (data.images) {
                  setPreviews(data.images.map(img => ({
                     url: `${API_BASE_URL}/uploads/${img}`,
                     type: 'image'
                  })));
               }
            });
      }

      getCategories().then((data) => {
         setCategories(data);
         setInitLoading(false);
      }).catch(console.error);
   }, [router]);

   // Attach camera stream to video element
   useEffect(() => {
      if (showCamera && cameraStream && videoRef.current) {
         videoRef.current.srcObject = cameraStream;
      }
   }, [showCamera, cameraStream]);

   // Recording Timer
   useEffect(() => {
      let interval;
      if (isRecording) {
         interval = setInterval(() => {
            setRecordingTime(prev => prev + 1);
         }, 1000);
      } else {
         setRecordingTime(0);
      }
      return () => clearInterval(interval);
   }, [isRecording]);

   const selectedCategory = useMemo(() =>
      categories.find(c => c.id === parseInt(formData.category_id)),
      [categories, formData.category_id]);


    const handleInputChange = (e) => {
       const { name, value } = e.target;
       if (name === "price") {
          // Only allow numbers and one decimal point
          const cleanValue = value.replace(/[^0-9.]/g, '');
          const parts = cleanValue.split('.');
          if (parts.length > 2) return; // Only one decimal point
          setFormData(prev => ({ ...prev, [name]: cleanValue }));
          return;
       }
       setFormData(prev => ({ ...prev, [name]: value }));
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

    const handleMediaChange = (e) => {
       const files = Array.from(e.target.files);
        if (images.length + files.length > 20) {
           alert("Max 20 files allowed");
           return;
        }
       const newPreviews = files.map(f => ({
          url: URL.createObjectURL(f),
          type: f.type.startsWith('video') ? 'video' : 'image'
       }));
       setImages([...images, ...files]);
       setPreviews([...previews, ...newPreviews]);
    };

    const removeMedia = (idx) => {
       setImages(images.filter((_, i) => i !== idx));
       setPreviews(previews.filter((_, i) => i !== idx));
    };

    const startCamera = async () => {
       try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
             video: { 
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
             }, 
             audio: true 
          });
          setCameraStream(stream);
          setShowCamera(true);
       } catch (err) {
          alert("Camera access denied or NOT available.");
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
          
          // Use natural video dimensions
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          
          // Create File object from data URL
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
               const file = new File([blob], `live_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
               setImages(prev => [...prev, file]);
               setPreviews(prev => [...prev, { url: dataUrl, type: 'image' }]);
               stopCamera();
            });
       }
    };

    const startRecording = () => {
       if (!cameraStream) return;
       
       recordedChunksRef.current = [];
       const options = { mimeType: 'video/webm;codecs=vp9,opus' };
       if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
       }

       const mediaRecorder = new MediaRecorder(cameraStream, options);
       mediaRecorderRef.current = mediaRecorder;

       mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
             recordedChunksRef.current.push(e.data);
          }
       };

       mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const file = new File([blob], `live_video_${Date.now()}.webm`, { type: 'video/webm' });
          
          setImages(prev => [...prev, file]);
          setPreviews(prev => [...prev, { url, type: 'video' }]);
          stopCamera();
       };

       mediaRecorder.start();
       setIsRecording(true);

       // Auto stop after 20s
       setTimeout(() => {
          if (mediaRecorder.state === "recording") stopRecording();
       }, 20000);
    };

    const stopRecording = () => {
       if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
       }
    };

   const handleSubmit = async (type = 'pending') => {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");

      try {
         const user = JSON.parse(localStorage.getItem("user"));
         const finalData = new FormData();

         finalData.append("title", formData.title);
         finalData.append("description", formData.description);
         finalData.append("price", formData.price);
         finalData.append("category_id", formData.category_id);
         finalData.append("product_type", formData.product_type);
         finalData.append("seller_id", user.id);
         finalData.append("status", type);
         finalData.append("condition_code", formData.condition_code);


         finalData.append("item_specifics", JSON.stringify(formData.item_specifics));
         finalData.append("condition_details", JSON.stringify(formData.condition_details));
         finalData.append("shipping_info", JSON.stringify(formData.shipping_info));
         finalData.append("payment_info", JSON.stringify(formData.payment_info));
         finalData.append("allow_offers", formData.allow_offers);
         finalData.append("shipping_fee", formData.shipping_fee || 0);
         finalData.append("shipping_type", formData.shipping_type);

         images.forEach(img => finalData.append("images", img));

         let res;
         if (editId) {
            res = await updateProduct(editId, finalData);
         } else {
            res = await createProduct(finalData);
         }

         if (res.product || res.message === "Product updated successfully" || res.message === "Listing successfully created") {
            const msg = type === 'draft' ? "Listing saved as draft!" : (editId ? "Listing updated successfully!" : "Product successfully listed");
            setShowSuccess({ show: true, message: msg });
            setTimeout(() => {
               router.push("/");
            }, 2500);
         } else {
            alert(res.message || "Failed to process listing.");
         }
      } catch (err) {
         console.error(err);
         alert("System error during listing.");
      } finally {
         setLoading(false);
      }
   };

   const handleMediaContinue = () => {
      if (!previews.some(p => p.type === 'video')) {
         alert("At least one video is mandatory to proceed with the listing. Please upload a video in the gallery.");
         return;
      }
      nextStep();
   };

   const nextStep = () => setStep(s => s + 1);
   const prevStep = () => setStep(s => s - 1);

   if (initLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
      <p className="font-black text-xs uppercase tracking-[0.5em] text-blue-600 ml-2">Loading Hub...</p>
   </div>;

   return (
      <div className="bg-[#f8f9fa] min-h-screen pb-20 font-sans text-[#191919]">
         {showSuccess.show && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-white/95 backdrop-blur-sm animate-in fade-in duration-500">
               <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-100 animate-in zoom-in duration-500">
                     <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                     </svg>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tight mb-4 animate-in slide-in-from-bottom-4 duration-500 delay-150 text-center">{showSuccess.message}</h2>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest animate-in fade-in duration-500 delay-300">Redirecting to Main Page...</p>
               </div>
            </div>
         )}
         <Navbar />

         <main className="max-w-4xl mx-auto px-4 py-8">

            <div className="mb-10">
               <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-tight">Create Listing</h1>
               <p className="text-gray-500 font-medium text-sm mt-2">Professional marketplace standards for collectors.</p>
               
               {productStatus === 'rejected' && rejectionReason && (
                  <div className="mt-6 p-5 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2 duration-500">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Listing Rejected by Admin</p>
                     </div>
                     <p className="text-[13px] text-rose-700 font-bold leading-relaxed">{rejectionReason}</p>
                     <p className="text-[10px] text-rose-400 font-medium mt-3 italic">Please address the issues above and update your listing to submit for re-review.</p>
                  </div>
               )}
            </div>

            {/* Multi-step Nav */}
            <div className="mb-10 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
               <div className="flex items-center justify-between min-w-[800px] px-4">
                  {[
                     { n: 1, t: "Basics" },
                     { n: 2, t: "Condition" },
                     { n: 3, t: "Media" },
                     { n: 4, t: "Specs" },
                     { n: 5, t: "Pricing" },
                     { n: 6, t: "Review" }
                  ].map((s) => (
                     <div key={s.n} className={`flex flex-col items-center gap-2 transition-all ${step === s.n ? 'scale-100' : 'opacity-40'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${step === s.n ? 'bg-blue-600 text-white shadow-md' : (step > s.n ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400')}`}>
                           {step > s.n ? "✓" : s.n}
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${step === s.n ? 'text-blue-600' : 'text-gray-500'}`}>{s.t}</span>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden min-h-[500px]">
               <div className="p-8 md:p-14">

                  {/* STEP 1: Basics */}
                  {step === 1 && (
                     <div className="animate-in fade-in duration-500 space-y-10">
                        <div className="space-y-3">
                           <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Listing Title</label>
                           <input
                              type="text"
                              name="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              placeholder="e.g. Omega Seamaster 300 Heritage 2021"
                              className="w-full bg-white border border-gray-200 p-5 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold text-gray-900 text-lg placeholder:text-gray-300 shadow-sm"
                           />
                        </div>

                        <div className="space-y-4">
                           <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Select Category</label>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {categories.map(c => (
                                 <button
                                    key={c.id}
                                    onClick={() => handleInputChange({ target: { name: 'category_id', value: c.id.toString() } })}
                                    className={`p-5 rounded-xl border transition-all text-center ${formData.category_id === c.id.toString() ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200'}`}
                                 >
                                    <p className={`text-[12px] font-semibold ${formData.category_id === c.id.toString() ? 'text-blue-600' : 'text-gray-600'}`}>{c.name}</p>
                                 </button>
                              ))}
                           </div>
                        </div>

                        <div className="pt-8 flex justify-end">
                           <button
                              onClick={nextStep}
                              disabled={!formData.title || !formData.category_id}
                              className="bg-blue-600 text-white px-10 py-4 rounded-lg font-bold text-[13px] uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-20 shadow-lg shadow-blue-100"
                           >
                              Continue
                           </button>
                        </div>
                     </div>
                  )}

                  {/* STEP 2: Condition */}
                  {step === 2 && (
                     <div className="animate-in fade-in duration-500 space-y-10">
                        <div className="space-y-4">
                           <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Condition Grade</label>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {[
                                 { c: "excellent", l: "Excellent", d: "Near mint, minimal wear" },
                                 { c: "good", l: "Good", d: "Minor scratches, daily wear" },
                                 { c: "fair", l: "Fair", d: "Visible wear, needs polish" },
                                 { c: "not_working", l: "Spares", d: "Not running, parts only" }
                              ].map(c => (
                                 <button
                                    key={c.c}
                                    onClick={() => handleInputChange({ target: { name: 'condition_code', value: c.c } })}
                                    className={`p-5 rounded-xl border text-left transition-all ${formData.condition_code === c.c ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                                 >
                                    <p className="text-[13px] font-bold text-gray-900">{c.l}</p>
                                    <p className="text-[10px] font-medium text-gray-500 mt-1">{c.d}</p>
                                 </button>
                              ))}
                           </div>
                        </div>

                         {selectedCategory?.conditions?.length > 0 && (
                            <div className="space-y-6">
                               <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Technical Condition Specs</label>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {selectedCategory.conditions.map(cf => {
                                     const isManual = formData.condition_details[`${cf.field_name}_manual_mode`];
                                     return (
                                        <div key={cf.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                                           <div className="flex justify-between items-center">
                                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{cf.field_label}</p>
                                              <button 
                                                 onClick={() => handleNestedChange('condition_details', `${cf.field_name}_manual_mode`, !isManual)}
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
                                                 className="w-full bg-blue-50/30 border border-blue-100 p-3 rounded-xl font-bold text-xs text-blue-600 outline-none"
                                                 placeholder={`Describe ${cf.field_label}`}
                                              />
                                           ) : (
                                              <select
                                                 onChange={(e) => handleNestedChange('condition_details', cf.field_name, e.target.value)}
                                                 value={formData.condition_details[cf.field_name] || ""}
                                                 className="w-full bg-gray-50/50 border border-gray-100 p-3 rounded-xl font-bold text-xs text-gray-900 focus:border-blue-600 outline-none"
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

                        <div className="pt-8 flex justify-between items-center">
                           <button onClick={prevStep} className="text-[12px] font-semibold text-gray-400 hover:text-gray-900 transition-colors">Back</button>
                           <button
                              onClick={nextStep}
                              disabled={!formData.condition_code}
                              className="bg-blue-600 text-white px-10 py-4 rounded-lg font-bold text-[13px] uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-20 shadow-lg shadow-blue-100"
                           >
                              Continue
                           </button>
                        </div>
                     </div>
                  )}

                  {/* STEP 3: Media */}
                  {step === 3 && (
                     <div className="animate-in fade-in duration-500 space-y-10">
                         <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <div className="flex-1 p-10 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-center relative hover:bg-white hover:border-blue-400 transition-all group overflow-hidden">
                               <div className="space-y-4 transition-transform group-hover:scale-105 duration-300">
                                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-gray-100">
                                     <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                     </svg>
                                  </div>
                                  <div>
                                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Upload Gallery</h3>
                                     <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-tight">Drag or Browse (Max 20)</p>
                                  </div>
                               </div>
                               <input type="file" multiple accept="image/*,video/*" onChange={handleMediaChange} className="absolute inset-0 opacity-0 cursor-pointer" title="" />
                            </div>

                            <button 
                               onClick={startCamera}
                               className="flex-1 p-10 bg-blue-50 border border-dashed border-blue-200 rounded-2xl text-center hover:bg-white hover:border-blue-400 transition-all group flex flex-col items-center justify-center gap-4"
                            >
                               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100 group-hover:scale-110 transition-transform">
                                  <Camera size={24} className="text-blue-600" />
                               </div>
                               <div>
                                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Take Live Photo</h3>
                                  <p className="text-[10px] font-medium text-blue-400 mt-1 uppercase tracking-tight">Use mobile/pc camera</p>
                               </div>
                            </button>
                         </div>

                         {showCamera && (
                            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300">
                               <div className="relative w-full max-w-2xl aspect-[3/4] sm:aspect-video bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
                                  <video 
                                     ref={videoRef} 
                                     autoPlay 
                                     playsInline 
                                     className="w-full h-full object-cover"
                                  />
                                  <canvas ref={canvasRef} className="hidden" />
                                  
                                  {/* Camera UI Overlay */}
                                  <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
                                     <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-2">
                                           <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20">
                                              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                                              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                                 {isRecording ? `Recording ${recordingTime}s` : 'Live Hub View'}
                                              </span>
                                           </div>
                                           {!isRecording && (
                                              <div className="flex bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/10 self-start">
                                                 <button 
                                                    onClick={() => setCameraMode('photo')}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${cameraMode === 'photo' ? 'bg-white text-gray-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                                                 >
                                                    Photo
                                                 </button>
                                                 <button 
                                                    onClick={() => setCameraMode('video')}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${cameraMode === 'video' ? 'bg-white text-gray-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                                                 >
                                                    Video
                                                 </button>
                                              </div>
                                           )}
                                        </div>
                                        <button 
                                           onClick={stopCamera} 
                                           disabled={isRecording}
                                           className="p-3 bg-black/40 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-rose-500/80 transition-all disabled:opacity-20"
                                        >
                                           <X size={20} />
                                        </button>
                                     </div>

                                     <div className="flex flex-col items-center gap-6">
                                        <p className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-[0.3em] text-center max-w-xs leading-relaxed drop-shadow-lg">
                                           {cameraMode === 'photo' ? 'Capture high-res authentication photo' : (isRecording ? 'Recording Hub authentication clip...' : 'Record 15s authentication clip')}
                                        </p>
                                        
                                        {cameraMode === 'photo' ? (
                                           <button 
                                              onClick={capturePhoto}
                                              className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-1 border-4 border-white/30 hover:scale-110 active:scale-95 transition-all shadow-2xl"
                                           >
                                              <div className="w-full h-full bg-white rounded-full border-2 border-gray-900 flex items-center justify-center">
                                                 <div className="w-12 h-12 bg-gray-900 rounded-full" />
                                              </div>
                                           </button>
                                        ) : (
                                           <button 
                                              onClick={isRecording ? stopRecording : startRecording}
                                              className={`w-20 h-20 rounded-full flex items-center justify-center p-1 border-4 transition-all shadow-2xl ${isRecording ? 'bg-rose-500 border-rose-500/30' : 'bg-white border-white/30 hover:scale-110'}`}
                                           >
                                              {isRecording ? (
                                                 <div className="w-8 h-8 bg-white rounded-md" />
                                              ) : (
                                                 <div className="w-14 h-14 bg-rose-600 rounded-full border-4 border-white" />
                                              )}
                                           </button>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            </div>
                         )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                           {previews.map((media, i) => (
                              <div key={i} className="aspect-square bg-white rounded-xl border border-gray-100 overflow-hidden relative group shadow-sm">
                                 {media.type === 'video' ? (
                                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                       <svg className="w-10 h-10 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                       </svg>
                                       <video src={media.url} className="absolute inset-0 w-full h-full object-cover opacity-30" muted />
                                    </div>
                                 ) : (
                                    <img src={media.url} className="w-full h-full object-cover" />
                                 )}
                                 <button onClick={() => removeMedia(i)} className="absolute top-2 right-2 w-6 h-6 bg-white/90 backdrop-blur text-red-600 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-md">✕</button>
                                 {i === 0 && <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-600 text-[9px] font-bold text-white rounded uppercase shadow-sm">Main</div>}
                                 <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 text-[8px] font-bold text-white rounded uppercase backdrop-blur-sm">{media.type}</div>
                              </div>
                           ))}
                           {Array.from({ length: Math.max(0, 5 - previews.length) }).map((_, idx) => (
                              <div key={idx} className="aspect-square bg-gray-50/50 border border-gray-100 rounded-xl flex items-center justify-center">
                                 <span className="text-gray-300 text-xl">+</span>
                              </div>
                           ))}
                        </div>

                        <div className="pt-8 flex justify-between items-center">
                           <button onClick={prevStep} className="text-[12px] font-semibold text-gray-400 hover:text-gray-900 transition-colors">Back</button>
                           <div className="flex flex-col items-end gap-2 text-right">
                              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">At least one video is required</p>
                              <button
                                 onClick={handleMediaContinue}
                                 disabled={images.length === 0}
                                 className="bg-blue-600 text-white px-10 py-4 rounded-lg font-bold text-[13px] uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-20 shadow-lg shadow-blue-100"
                              >
                                 Continue
                              </button>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* STEP 4: Detailed Specs */}
                  {step === 4 && (
                     <div className="animate-in fade-in duration-500 space-y-10">
                        <div className="space-y-3">
                           <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Item Description</label>
                           <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleInputChange}
                              rows="6"
                              placeholder="Add a detailed description about your item..."
                              className="w-full bg-white border border-gray-200 p-6 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium text-gray-700 text-[15px] placeholder:text-gray-300 resize-none shadow-sm"
                           />
                        </div>

                        {selectedCategory?.specs?.length > 0 && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                              {selectedCategory.specs.map(s => {
                                 const isManual = formData.item_specifics[`${s.field_name}_manual_mode`];
                                 return (
                                    <div key={s.id} className="space-y-3 bg-gray-50/30 p-5 rounded-2xl border border-gray-100/50">
                                       <div className="flex justify-between items-center">
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{s.field_label} {s.is_required && "*"}</label>
                                          <button 
                                             onClick={() => handleNestedChange('item_specifics', `${s.field_name}_manual_mode`, !isManual)}
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
                                             className="w-full bg-white border border-blue-100 p-4 rounded-xl font-black text-xs text-blue-600 outline-none shadow-sm placeholder:text-blue-200"
                                             placeholder={`Enter Custom ${s.field_label}`}
                                          />
                                       ) : (
                                          s.field_type === 'select' ? (
                                             <select
                                                onChange={(e) => handleNestedChange('item_specifics', s.field_name, e.target.value)}
                                                value={formData.item_specifics[s.field_name] || ""}
                                                className="w-full bg-white border border-gray-200 p-4 rounded-xl font-bold text-xs text-gray-900 focus:border-blue-600 outline-none shadow-sm"
                                             >
                                                <option value="">Select Option</option>
                                                {s.options.map(o => <option key={o} value={o}>{o}</option>)}
                                             </select>
                                          ) : (
                                             <input
                                                type={s.field_type}
                                                onChange={(e) => handleNestedChange('item_specifics', s.field_name, e.target.value)}
                                                value={formData.item_specifics[s.field_name] || ""}
                                                className="w-full bg-white border border-gray-200 p-4 rounded-xl font-bold text-xs text-gray-900 focus:border-blue-600 outline-none shadow-sm"
                                                placeholder={`e.g. ${s.field_label}`}
                                             />
                                          )
                                       )}
                                    </div>
                                 );
                              })}
                           </div>
                        )}

                        <div className="pt-8 flex justify-between items-center">
                           <button onClick={prevStep} className="text-[12px] font-semibold text-gray-400 hover:text-gray-900 transition-colors">Back</button>
                           <button
                              onClick={nextStep}
                              className="bg-blue-600 text-white px-10 py-4 rounded-lg font-bold text-[13px] uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                           >
                              Continue
                           </button>
                        </div>
                     </div>
                  )}



                   {/* STEP 5: Pricing */}
                   {step === 5 && (
                      <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 space-y-12 py-6">
                         <div className="text-center space-y-3">
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Set Your Valuation</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing standards for the collector hub</p>
                         </div>

                         <div className="max-w-2xl mx-auto space-y-10">
                            {/* Product Price */}
                            <div className="relative group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 hover:border-blue-200 transition-all">
                               <div className="flex flex-col items-center gap-6">
                                  <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                                     <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Item Valuation</span>
                                  </div>
                                  <div className="relative w-full max-w-sm">
                                     <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                                        <span className="text-3xl font-black text-gray-200">₹</span>
                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">INR</span>
                                     </div>
                                     <input
                                        type="text"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        className="w-full text-center text-6xl font-black bg-transparent outline-none text-gray-950 placeholder:text-gray-100 px-10 focus:placeholder:opacity-0 transition-all font-mono"
                                        placeholder="0.00"
                                        inputMode="decimal"
                                     />
                                  </div>
                               </div>
                            </div>

                            {/* Shipping Options */}
                            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 space-y-8">
                               <div className="flex flex-col items-center gap-2">
                                  <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-full border border-amber-100">
                                     <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                     <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Shipping Configuration</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">How will this reach the buyer?</p>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Fixed Fee Input */}
                                  <div className={`p-6 rounded-2xl border-2 transition-all flex flex-col gap-4 ${formData.shipping_type === 'fixed' ? 'border-gray-900 bg-gray-50/30' : 'border-gray-50 opacity-40 grayscale pointer-events-none'}`}>
                                     <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                                           <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">Fixed Fee</span>
                                     </div>
                                     <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl font-black text-gray-300">₹</span>
                                        <input
                                           type="text"
                                           name="shipping_fee"
                                           value={formData.shipping_fee}
                                           onChange={(e) => {
                                              const val = e.target.value.replace(/[^0-9]/g, '');
                                              setFormData(prev => ({ ...prev, shipping_fee: val }));
                                           }}
                                           placeholder="Fee amount"
                                           className="w-full pl-6 py-2 bg-transparent border-b-2 border-gray-200 focus:border-gray-900 outline-none font-black text-xl text-gray-950 transition-all"
                                        />
                                     </div>
                                  </div>

                                  {/* Toggles */}
                                  <div className="flex flex-col gap-3">
                                     <button 
                                        onClick={() => handleShippingToggle('free')}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${formData.shipping_type === 'free' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-50 hover:border-gray-200'}`}
                                     >
                                        <div>
                                           <p className={`text-[12px] font-black uppercase tracking-widest ${formData.shipping_type === 'free' ? 'text-emerald-700' : 'text-gray-900'}`}>Free Shipping</p>
                                           <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Seller covers all costs</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.shipping_type === 'free' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 group-hover:border-gray-400'}`}>
                                           {formData.shipping_type === 'free' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                     </button>

                                     <button 
                                        onClick={() => handleShippingToggle('contact')}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${formData.shipping_type === 'contact' ? 'border-blue-500 bg-blue-50' : 'border-gray-50 hover:border-gray-200'}`}
                                     >
                                        <div>
                                           <p className={`text-[12px] font-black uppercase tracking-widest ${formData.shipping_type === 'contact' ? 'text-blue-700' : 'text-gray-900'}`}>Contact for Quote</p>
                                           <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Calculated by dimensions</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.shipping_type === 'contact' ? 'bg-blue-500 border-blue-500' : 'border-gray-200 group-hover:border-gray-400'}`}>
                                           {formData.shipping_type === 'contact' && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                     </button>
                                  </div>
                               </div>

                               <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                     <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight leading-relaxed">
                                     Pricing transparency is key. Make sure to specify if shipping is included or separate for clarity.
                                  </p>
                               </div>
                            </div>
                         </div>

                         <div className="pt-12 flex justify-between items-center max-w-2xl mx-auto w-full">
                            <button onClick={prevStep} className="group flex items-center gap-2 text-[11px] font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest">
                               <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                               Basics
                            </button>
                            <button
                               onClick={nextStep}
                               disabled={!formData.price || (formData.shipping_type === 'fixed' && !formData.shipping_fee)}
                               className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all disabled:opacity-20 shadow-xl shadow-blue-100 hover:scale-105 active:scale-95"
                            >
                               Review Listing
                            </button>
                         </div>
                      </div>
                   )}

                  {/* STEP 6: Review & Preview */}
                  {step === 6 && (
                     <div className="animate-in fade-in duration-500 space-y-10">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                           <div>
                              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Review Your Listing</h2>
                              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">This is how your asset will appear on the Hub</p>
                           </div>
                           <div className="flex gap-3 mt-4 md:mt-0">
                               <button onClick={prevStep} className="bg-white text-gray-600 border border-gray-200 px-6 py-3 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-gray-50 transition-all">
                                  Edit Details
                               </button>
                               <button
                                  onClick={() => handleSubmit('pending')}
                                  disabled={loading}
                                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                               >
                                  {loading ? 'Processing...' : 'Complete Listing'}
                               </button>
                           </div>
                        </div>

                        {/* Preview Container */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative opacity-100 border-2 border-blue-100">
                           {/* Watermark/Banner */}
                           <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-1.5 rounded-bl-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-md z-20">
                              Live Preview
                           </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12">
                            {/* Gallery Preview */}
                            <div className="lg:col-span-6 p-6 md:p-10 border-r border-gray-100 bg-gray-50/10">
                              <div className="aspect-square bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                                {previews[0]?.type === 'video' ? (
                                  <video 
                                    src={previews[0].url} 
                                    className="w-full h-full object-contain" 
                                    controls 
                                    muted 
                                  />
                                ) : (
                                  <img
                                    src={previews[0]?.url || previews[0]}
                                    alt="Preview"
                                    className="w-full h-full object-contain mix-blend-multiply p-8"
                                  />
                                )}
                              </div>
                              <div className="grid grid-cols-4 md:grid-cols-5 gap-3 mt-6">
                                 {previews.map((item, i) => (
                                    <div key={i} className="aspect-square bg-white border border-gray-100 rounded-lg overflow-hidden relative">
                                       {item.type === 'video' ? (
                                         <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                            </svg>
                                         </div>
                                       ) : (
                                         <img src={item.url || item} className="w-full h-full object-cover" />
                                       )}
                                    </div>
                                 ))}
                              </div>
                            </div>

                            {/* Content Preview */}
                            <div className="lg:col-span-6 p-8 md:p-12 flex flex-col">
                              <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">{formData.condition_code || "PRE-OWNED"}</span>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                       <span className="text-blue-600">{selectedCategory?.name || 'Category'}</span>
                                    </div>
                                 </div>

                                <h1 className="text-3xl md:text-4xl font-bold text-gray-950 leading-tight tracking-tight mb-6 uppercase">
                                  {formData.title || "Listing Title"}
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
                                          <span className="text-4xl md:text-5xl font-bold text-gray-950 tracking-tight">₹{parseFloat(formData.price || 0).toLocaleString()}</span>
                                          <div className="flex items-center gap-1.5 mt-1">
                                             <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                             <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">
                                                {formData.shipping_type === 'free' ? (
                                                   <span className="text-emerald-600">Free Shipping</span>
                                                ) : formData.shipping_type === 'contact' ? (
                                                    <span className="text-blue-600">Contact for Quote</span>
                                                ) : (
                                                   <>+ ₹{parseFloat(formData.shipping_fee || 0).toLocaleString()} Shipping</>
                                                )}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="pt-6">
                                       <button disabled className="w-full h-14 bg-gray-200 text-gray-400 rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 cursor-not-allowed">
                                          <span>Chat with Seller</span>
                                       </button>
                                       {formData.allow_offers && (
                                          <button disabled className="w-full h-14 mt-4 bg-white border-2 border-gray-200 text-gray-400 rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 cursor-not-allowed">
                                             <span>Make Offer</span>
                                          </button>
                                       )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Specs Grid Preview */}
                          <div className="border-t border-gray-100 bg-white">
                             <div className="p-8 pb-4">
                               <h2 className="text-lg font-bold text-gray-950 tracking-tight text-left">Technical Asset Specifications</h2>
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-gray-100 text-left">
                                {Object.entries(formData.item_specifics || {})
                                  .filter(([key]) => !key.endsWith('_manual_mode'))
                                  .map(([key, value], i) => (
                                  <div key={key} className="p-8 border-b border-gray-50 md:border-r">
                                     <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{key.replace(/_/g, ' ')}</p>
                                     <p className="text-base font-bold text-gray-900 uppercase">{value || 'N/A'}</p>
                                  </div>
                                ))}
                             </div>
                          </div>

                          {/* Description Tab Preview */}
                          <div className="border-t border-gray-100 bg-white p-8 px-8 md:px-12 text-left">
                             <div className="flex gap-10 border-b border-gray-100 mb-8">
                                <button className="pb-4 text-[12px] font-bold uppercase tracking-widest border-b-2 border-blue-600 text-blue-600">
                                   Description
                                </button>
                             </div>
                             <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap max-w-4xl text-left">
                                {formData.description || "No description provided."}
                             </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-center pt-6 pb-4">
                           <button onClick={() => handleSubmit('draft')} disabled={loading} className="text-[11px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest border-b border-gray-200 pb-1">
                              Save as Draft Instead
                           </button>
                        </div>
                     </div>
                  )}

               </div>
            </div>
         </main>
      </div>
   );
}