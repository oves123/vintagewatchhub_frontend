"use client";

import Link from "next/link";
import { 
  LayoutDashboard, Users, Package, LogOut,
  ChevronRight, ShieldCheck, Menu, X, ShoppingCart,
  MessageSquare
} from "lucide-react";

function WCHLogo() {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="18" r="12" stroke="#1e3a5f" strokeWidth="2"/>
        <circle cx="16" cy="18" r="8" stroke="#b8860b" strokeWidth="1.5"/>
        <line x1="16" y1="10" x2="16" y2="18" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="18" x2="21" y2="18" stroke="#b8860b" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 6 L12 3 L14 5 L16 2 L18 5 L20 3 L22 6 Z" fill="#b8860b"/>
        <circle cx="16" cy="18" r="1.5" fill="#1e3a5f"/>
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-bold tracking-tight text-gray-950 text-[16px]">
          Watch<span className="text-[#1e3a5f]">Collector</span><span className="text-[#b8860b] font-black">HUB</span>
        </span>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Admin Panel</span>
      </div>
    </div>
  );
}

export default function AdminSidebar({ activeTab, setActiveTab, adminUser, onLogout, isOpen, setIsOpen, unreadMessagesCount }) {
  const menuItems = [
    { id: "overview",  label: "Dashboard",        icon: LayoutDashboard },
    { id: "users",     label: "User Management",  icon: Users            },
    { id: "products",  label: "Listings",         icon: Package          },
    { id: "orders",    label: "Orders",           icon: ShoppingCart     },
    { id: "reports",   label: "Reports",          icon: ShieldCheck      },
    { id: "chats",     label: "Chats & Messages", icon: MessageSquare    },
    { id: "settings",  label: "Platform Protocol", icon: ShieldCheck      },
  ];

  const handleTabClick = (id) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[50] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`w-64 bg-white border-r border-gray-100 h-full fixed left-0 top-0 z-[60] flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <Link href="/" className="block">
            <WCHLogo />
          </Link>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-900 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-grow overflow-y-auto p-4 space-y-1">
          <p className="px-3 text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3 mt-2">Navigation</p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] font-bold tracking-tight transition-all ${
                activeTab === item.id
                  ? "bg-[#1e3a5f] text-white shadow-lg"
                  : "text-gray-500 hover:bg-blue-50 hover:text-[#1e3a5f]"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} className={activeTab === item.id ? "text-white" : "text-gray-400 group-hover:text-[#1e3a5f]"} />
                <span>{item.label}</span>
              </div>
              {activeTab === item.id
                ? <div className="w-1.5 h-1.5 rounded-full bg-[#b8860b]" />
                : item.id === "chats" && unreadMessagesCount > 0 ? (
                  <span className="bg-[#1e3a5f] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</span>
                ) : (
                  <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-gray-300 transition-all" />
                )
              }
            </button>
          ))}
        </div>

        {/* Security badge */}
        <div className="px-4 pb-2">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={13} className="text-[#1e3a5f]" />
              <span className="text-[9px] font-black text-[#1e3a5f] uppercase tracking-widest">Secured Session</span>
            </div>
            <p className="text-[10px] font-bold text-gray-500 leading-snug">All actions are audit-logged.</p>
          </div>
        </div>

        {/* User footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-[#1e3a5f] flex items-center justify-center font-black text-white text-sm uppercase">
              {adminUser?.name?.[0] || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-[12px] font-black text-gray-900 truncate">{adminUser?.name || "Administrator"}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Admin</p>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
