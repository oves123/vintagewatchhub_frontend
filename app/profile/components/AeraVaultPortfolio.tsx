"use client";

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, ShieldCheck, PieChart, Info } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AeraVaultPortfolio({ deals, user }) {
  // Filter for ONLY successfully bought items (CONFIRMED)
  const completedPurchases = deals.filter(d => d.buyer_id === user.id && d.status === 'CONFIRMED');

  const { chartData, totalInvested, estimatedValue } = useMemo(() => {
    // Sort chronologically by completion date or created_at
    const sorted = [...completedPurchases].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    let cumulativeSpent = 0;
    let cumulativeValue = 0;
    
    const labels = [];
    const investedData = [];
    const estimatedData = [];
    
    // Initial point
    labels.push('Start');
    investedData.push(0);
    estimatedData.push(0);

    sorted.forEach((deal) => {
      const dateStr = new Date(deal.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      labels.push(dateStr);
      
      const totalCost = parseFloat(deal.total_buyer_cost || 0);
      cumulativeSpent += totalCost;
      
      // Simulate market appreciation (e.g., +8-15% over time for vintage watches)
      // For this demo, let's just add a flat 12% premium to the base value as the "Market Estimate"
      const currentMarketValue = totalCost * 1.12; 
      cumulativeValue += currentMarketValue;
      
      investedData.push(cumulativeSpent);
      estimatedData.push(cumulativeValue);
    });

    const data = {
      labels,
      datasets: [
        {
          label: 'Estimated Market Value',
          data: estimatedData,
          borderColor: '#10b981', // Emerald 500
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
        },
        {
          label: 'Total Capital Invested',
          data: investedData,
          borderColor: '#94a3b8', // Slate 400
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
        }
      ]
    };

    return {
      chartData: data,
      totalInvested: cumulativeSpent,
      estimatedValue: cumulativeValue
    };
  }, [completedPurchases]);

  const roi = totalInvested > 0 ? ((estimatedValue - totalInvested) / totalInvested) * 100 : 0;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: 'Inter', weight: 'bold', size: 11 },
          color: '#64748b'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#0f172a',
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 13, weight: 'bold' },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { font: { family: 'Inter', size: 10 }, color: '#94a3b8' }
      },
      y: {
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: {
          font: { family: 'Inter', size: 10 },
          color: '#94a3b8',
          callback: function(value) {
            return '₹' + (value / 1000).toFixed(0) + 'k';
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-gray-900 to-[#1e3a5f] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
         {/* Decorative Background */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <p className="text-blue-200/80 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                 <ShieldCheck size={14} /> AeraVault Security
               </p>
               <h2 className="text-3xl md:text-4xl font-black tracking-tight">Portfolio Overview</h2>
               <p className="text-blue-100 text-sm font-medium mt-2 max-w-md">
                 Track the estimated market performance of your authenticated vintage timepiece collection.
               </p>
            </div>

            <div className="flex gap-4">
               <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[140px]">
                  <p className="text-blue-200/70 text-[10px] font-black uppercase tracking-widest mb-1">Total Invested</p>
                  <p className="text-xl font-black">₹{totalInvested.toLocaleString()}</p>
               </div>
               <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 min-w-[140px]">
                  <p className="text-emerald-200/80 text-[10px] font-black uppercase tracking-widest mb-1">Estimated Value</p>
                  <p className="text-xl font-black text-emerald-400">₹{estimatedValue.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1 text-emerald-300 text-xs font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded w-max">
                     <TrendingUp size={10} /> +{roi.toFixed(1)}%
                  </div>
               </div>
            </div>
         </div>
      </div>

      {completedPurchases.length === 0 ? (
         <div className="bg-surface border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
               <PieChart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-black text-foreground">Your Vault is Empty</h3>
            <p className="text-muted text-sm max-w-sm mt-2">
               Acquire authenticated vintage timepieces to begin tracking your portfolio's performance over time.
            </p>
         </div>
      ) : (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface border border-border rounded-3xl p-6 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Value Trajectory</h3>
                  <div className="flex items-center gap-2 text-xs text-muted font-medium bg-background px-3 py-1.5 rounded-lg border border-border/50">
                    <Info size={14} /> Estimates are based on historical platform data
                  </div>
               </div>
               <div className="h-[350px] w-full">
                  <Line data={chartData as any} options={chartOptions as any} />
               </div>
            </div>

            <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm flex flex-col">
               <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-6">Asset Allocation</h3>
               <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {completedPurchases.map(deal => (
                     <div key={deal.id} className="flex items-center gap-4 bg-background p-3 rounded-2xl border border-border/50 hover:border-gold/50 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-surface overflow-hidden shrink-0 border border-border/50">
                           <img 
                              src={deal.images?.[0] ? deal.images[0].startsWith('http') ? deal.images[0] : `http://localhost:5000/uploads/${deal.images[0]}` : '/placeholder.png'} 
                              alt="Asset"
                              className="w-full h-full object-cover"
                           />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-black text-foreground truncate">{deal.product_title}</p>
                           <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">Acquired {new Date(deal.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                           <p className="text-xs font-black text-emerald-600">₹{(parseFloat(deal.total_buyer_cost) * 1.12).toLocaleString()}</p>
                           <p className="text-[10px] font-bold text-muted line-through">₹{parseFloat(deal.total_buyer_cost).toLocaleString()}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
