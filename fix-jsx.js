const fs = require('fs');

const content = fs.readFileSync('app/profile/page.js', 'utf8');

const target1 = `                                            {/* Left - Status Detail */}
                                             <div className="bg-background rounded-xl p-5 border border-border/50">`;

const target2 = `                                               {deal.status === 'SHIPPED' && (`;

const idx1 = content.indexOf(target1);
const idx2 = content.indexOf(target2, idx1);

if (idx1 !== -1 && idx2 !== -1) {
  const replacement = `                                            {/* Left - Status Detail */}
                                             <div className="bg-background rounded-xl p-5 border border-border/50">
                                                {deal.status === 'ACCEPTED' && (
                                                   <div className="flex items-start gap-3">
                                                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
                                                      <div>
                                                         <p className="text-sm font-black text-foreground uppercase">Awaiting Payment</p>
                                                         <p className="text-xs text-muted font-bold uppercase mt-1">Buyer is sending funds to Escrow.</p>
                                                      </div>
                                                   </div>
                                                )}

                                                {deal.status === 'PAID' && (
                                                   <div className="flex flex-col gap-4">
                                                      <div className="flex items-start gap-3">
                                                         <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><PieChart className="w-4 h-4 text-primary" /></div>
                                                         <div>
                                                            <p className="text-xs font-black text-foreground uppercase">Funds Verified</p>
                                                            <p className="text-xs text-muted font-bold uppercase mt-1">Please prepare the shipment.</p>
                                                         </div>
                                                      </div>
                                                      {deal.payment_receipt && (
                                                         <button 
                                                            onClick={() => setPaymentReceiptModal(deal.payment_receipt?.startsWith('http') ? deal.payment_receipt : \`\${API_BASE_URL}/uploads/\${deal.payment_receipt}\`)}
                                                            className="w-full py-2 bg-surface border border-border rounded-lg text-xs font-black uppercase tracking-widest text-foreground hover:bg-background transition-all flex items-center justify-center gap-2"
                                                         >
                                                            <Camera className="w-4 h-4" /> View Receipt
                                                         </button>
                                                      )}
                                                   </div>
                                                )}

`;

  const newContent = content.substring(0, idx1) + replacement + content.substring(idx2);
  fs.writeFileSync('app/profile/page.js', newContent);
  console.log('Fixed successfully');
} else {
  console.log('Could not find targets', idx1, idx2);
}
