const fs = require('fs');
const path = 'c:/Users/ovesk/watch-auction-marketplace/frontend/app/admin/page.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix images in UserDetailModal (Asset Inventory)
content = content.replace(
    /<img src={p\.image \? `\${API_BASE_URL}\/uploads\/\${p\.image}` : "\/placeholder-watch\.png"} className="w-full h-full object-contain" \/>/g,
    '<img src={getDisplayImage(p)} className="w-full h-full object-contain" />'
);

// 2. Prepare ProductDetailModal
const modalContent = `
        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setSelectedProduct(null)}></div>
             <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-400">
                <div className="p-8 md:p-10 overflow-y-auto">
                   <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-6">
                         <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-2 overflow-hidden shrink-0 shadow-sm">
                            <img src={getDisplayImage(selectedProduct)} className="w-full h-full object-contain" />
                         </div>
                         <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">{selectedProduct.title}</h2>
                            <p className="text-[11px] font-bold text-blue-600 mt-1 uppercase tracking-widest">{selectedProduct.category_name}</p>
                            <div className="flex gap-3 mt-4">
                               <span className="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-white shadow-sm">₹{parseFloat(selectedProduct.price).toLocaleString()}</span>
                               <span className={\`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wider $\{selectedProduct.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : (selectedProduct.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')}\`}>
                                  {selectedProduct.status || 'pending'}
                               </span>
                            </div>
                         </div>
                      </div>
                      <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      <div className="md:col-span-2 space-y-10">
                         {/* Listing Metadata */}
                         <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Authenticated Uploader</p>
                               <p className="text-sm font-bold text-slate-900">{selectedProduct.seller_name || "System Admin"}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Listing Date</p>
                               <p className="text-sm font-bold text-slate-900">{new Date(selectedProduct.created_at).toLocaleDateString()}</p>
                            </div>
                         </div>

                         {/* Description */}
                         <div>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Product Narrative</h3>
                            <p className="text-[13px] text-slate-600 leading-relaxed font-medium bg-white p-6 rounded-2xl border border-slate-100">{selectedProduct.description || "No description provided."}</p>
                         </div>

                         {/* Technical Specs */}
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Mechanism & Build</h3>
                               <div className="space-y-2">
                                  {Object.entries(selectedProduct.item_specifics || {}).map(([key, val]) => (
                                     !key.endsWith('_manual_mode') && (
                                        <div key={key} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                                           <span className="text-[10px] font-bold text-slate-400 uppercase">{key.replace(/_/g, ' ')}</span>
                                           <span className="text-[10px] font-bold text-slate-900 uppercase">{String(val)}</span>
                                        </div>
                                     )
                                  ))}
                               </div>
                            </div>
                            <div>
                               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Certified Condition</h3>
                               <div className="space-y-2">
                                  <div className="flex justify-between p-3 bg-slate-50 rounded-lg border-l-2 border-slate-900">
                                     <span className="text-[10px] font-bold text-slate-400 uppercase">Grade</span>
                                     <span className="text-[10px] font-bold text-slate-900 uppercase font-black">{selectedProduct.condition_code}</span>
                                  </div>
                                  {Object.entries(selectedProduct.condition_details || {}).map(([key, val]) => (
                                     !key.endsWith('_manual_mode') && (
                                        <div key={key} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                                           <span className="text-[10px] font-bold text-slate-400 uppercase">{key.replace(/_/g, ' ')}</span>
                                           <span className="text-[10px] font-bold text-slate-900 uppercase">{String(val)}</span>
                                        </div>
                                     )
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div>
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Gallery Assets</h3>
                            <div className="grid grid-cols-2 gap-3">
                               {(Array.isArray(selectedProduct.images) ? selectedProduct.images : (typeof selectedProduct.images === 'string' ? JSON.parse(selectedProduct.images || '[]') : [])).map((img, index) => (
                                  <div key={index} className="aspect-square rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
                                     <img src={\`\${API_BASE_URL}/uploads/\${img}\`} className="w-full h-full object-contain" />
                                  </div>
                               ))}
                            </div>
                         </div>
                         
                         <div className="pt-8 border-t border-slate-100 flex flex-col gap-3">
                            {selectedProduct.status !== 'approved' && (
                               <button 
                                  onClick={() => { updateProductStatus(selectedProduct.id, 'approved'); setSelectedProduct(null); }}
                                  className="w-full py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                               >
                                  Authorize Listing
                               </button>
                            )}
                            <button 
                               onClick={() => { if(confirm("Permanently purge this record?")) { deleteProduct(selectedProduct.id); setSelectedProduct(null); } }}
                               className="w-full py-4 bg-white text-rose-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition-all font-sans"
                            >
                               Purge Inventory Record
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}`;

const userModalClose = content.indexOf(')}', content.lastIndexOf('selectedUser && ('));
if (userModalClose !== -1) {
    const insertIdx = userModalClose + 2;
    content = content.substring(0, insertIdx) + modalContent + content.substring(insertIdx);
    fs.writeFileSync(path, content);
    console.log("Admin page updated successfully.");
}
