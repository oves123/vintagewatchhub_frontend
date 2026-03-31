"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Navbar from "../../components/Navbar";
import { useRouter } from "next/navigation";
import { getCategories, createProduct, API_URL, API_BASE_URL } from "../../services/api";
import { Camera, RefreshCw, X, Circle } from "lucide-react";
import "./sell.css";

export default function SellPage() {
   const [step, setStep] = useState(1);
   const [categories, setCategories] = useState([]);
   const [loading, setLoading] = useState(false);
   const [initLoading, setInitLoading] = useState(true);
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
      allow_offers: false
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
                  allow_offers: data.allow_offers || false
               });
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

         images.forEach(img => finalData.append("images", img));

         let res;
         if (editId) {
            res = await updateProduct(editId, finalData);
         } else {
            res = await createProduct(finalData);
         }

         if (res.product || res.message === "Product updated successfully" || res.message === "Listing successfully created") {
            alert(type === 'draft' ? "Listing saved as draft!" : (editId ? "Listing updated successfully!" : "Item successfully listed!"));
            router.push("/profile?tab=selling");
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
         <Navbar />

         <main className="max-w-4xl mx-auto px-4 py-8">

            <div className="mb-10">
               <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-tight">Create Listing</h1>
               <p className="text-gray-500 font-medium text-sm mt-2">Professional marketplace standards for collectors.</p>
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

                         <div className="price-input-container max-w-xl mx-auto">
                            <div className="flex flex-col items-center gap-8">
                                <div className="relative w-full">
                                   <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center">
                                      <span className="text-3xl font-black text-blue-600">₹</span>
                                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">INR</span>
                                   </div>
                                   <input
                                      type="text"
                                      name="price"
                                      value={formData.price}
                                      onChange={handleInputChange}
                                      className="w-full text-center text-7xl font-black bg-transparent outline-none text-gray-950 placeholder:text-gray-100 py-10 px-20 border-b-4 border-gray-50 focus:border-blue-600 transition-all rounded-t-3xl"
                                      placeholder="0.00"
                                      inputMode="decimal"
                                   />
                                </div>
                                
                                <div className="w-full">

                                 </div>

                                 <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 max-w-sm">
                                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                       <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-[10px] text-amber-800 font-bold uppercase tracking-tight leading-relaxed">
                                       Price listed is a guide. All final settlements are executed via verified hub support.
                                    </p>
                                 </div>
                            </div>
                         </div>

                         <div className="pt-12 flex justify-between items-center max-w-xl mx-auto w-full">
                            <button onClick={prevStep} className="group flex items-center gap-2 text-[11px] font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-widest">
                               <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                               Basics
                            </button>
                            <button
                               onClick={nextStep}
                               disabled={!formData.price}
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
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 relative overflow-hidden">
                           <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                               <div className="w-full md:w-32 aspect-square rounded-xl overflow-hidden shadow-md border border-white relative whitespace-nowrap">
                                  {previews[0]?.type === 'video' ? (
                                     <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                        <video src={previews[0]?.url} className="absolute inset-0 w-full h-full object-cover opacity-30" muted />
                                     </div>
                                  ) : (
                                     <img src={previews[0]?.url || previews[0]} className="w-full h-full object-cover" />
                                  )}
                               </div>
                              <div className="flex-grow space-y-2 text-center md:text-left">
                                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{selectedCategory?.name}</p>
                                 <h3 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">{formData.title}</h3>
                                 <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <span className="px-3 py-1 bg-white rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-100 text-gray-500">{formData.condition_code}</span>
                                    <span className="px-3 py-1 bg-blue-600 text-white rounded-md text-[11px] font-bold shadow-md shadow-blue-100">₹{parseFloat(formData.price).toLocaleString()}</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm">
                           <div className="space-y-4">
                              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Marketplace Standards</h4>
                              <ul className="space-y-3">
                                 <li className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                                    <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                       <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                    Professional Hub Authentication
                                 </li>
                                 <li className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                                    <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                       <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    </div>
                                    Indian Domestic Shipping Network
                                 </li>
                              </ul>
                           </div>
                           <div className="flex flex-col gap-3">
                              <button
                                  onClick={() => handleSubmit('pending')}
                                 disabled={loading}
                                 className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold text-[13px] uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                              >
                                 {loading ? 'Processing...' : 'Complete Listing'}
                              </button>
                              <button
                                 onClick={() => handleSubmit('draft')}
                                 disabled={loading}
                                 className="w-full bg-white text-gray-600 border border-gray-200 p-4 rounded-lg font-bold text-[13px] uppercase tracking-wider hover:bg-gray-50 transition-all"
                              >
                                 Save as Draft
                              </button>
                           </div>
                        </div>

                        <div className="pt-4 flex justify-center">
                           <button onClick={prevStep} className="text-[11px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest border-b border-gray-200 pb-1">Modify Details</button>
                        </div>
                     </div>
                  )}

               </div>
            </div>
         </main>
      </div>
   );
}