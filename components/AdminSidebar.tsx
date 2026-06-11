"use client";

import Link from "next/link";
import WCHLogo from "./WCHLogo";
import { LayoutDashboard, Users, Package, ShoppingCart, Tags, CreditCard, Gavel, ShieldCheck, MessageSquare, BarChart3, Settings, ChevronRight, X, LogOut } from "lucide-react";

export default function AdminSidebar({ activeTab, setActiveTab, adminUser, onLogout, isOpen, setIsOpen, unreadMessagesCount }) {
  const menuItems = [
    { id: "overview",    label: "Dashboard",           icon: LayoutDashboard },
    { id: "users",       label: "User Management",     icon: Users            },
    { id: "products",    label: "Listings",            icon: Package          },
    { id: "orders",      label: "Orders",              icon: ShoppingCart     },
    { id: "categories",  label: "Categories & Brands", icon: Tags             },
    { id: "escrow",      label: "Escrow & Payouts",    icon: CreditCard       },
    { id: "auctions",    label: "Auctions",             icon: Gavel            },
    { id: "bids",        label: "Bid History",          icon: Gavel            },
    { id: "disputes",    label: "Disputes",             icon: ShieldCheck      },
    { id: "coupons",     label: "Coupons",              icon: Tags             },
    { id: "verification",label: "Verification",          icon: ShieldCheck      },
    { id: "featured",    label: "Promotions",            icon: Package          },
    { id: "reports",     label: "Reports",             icon: ShieldCheck      },
    { id: "chats",       label: "Chats & Messages",    icon: MessageSquare    },
    { id: "financials",  label: "Financial Audit",     icon: BarChart3        },
    { id: "audit",       label: "Admin Audit Log",     icon: ShieldCheck      },
    { id: "settings",    label: "Platform Protocol",    icon: Settings         },
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

      <aside className={`w-64 bg-surface border-r border-border h-full fixed left-0 top-0 z-[60] flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <WCHLogo showAdminLabel />
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-1.5 text-muted hover:text-foreground rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-grow overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all ${
                activeTab === item.id
                  ? "bg-primary text-white shadow-lg"
                  : "text-muted hover:bg-blue-50 hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} className={activeTab === item.id ? "text-white" : "text-muted group-hover:text-primary"} />
                <span>{item.label}</span>
              </div>
              {activeTab === item.id
                ? null
                : item.id === "chats" && unreadMessagesCount > 0 ? (
                  <span className="bg-primary text-white text-xs font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}</span>
                ) : (
                  <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-muted transition-all" />
                )
              }
            </button>
          ))}
        </div>

        <div className="px-4 pb-2 border-t border-border pt-4">
          <p className="text-xs font-bold text-primary">Admin Panel</p>
          <p className="text-xs mt-0.5">{adminUser?.name || "Administrator"}</p>
        </div>

        {/* User footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-xs font-bold text-muted">{adminUser?.name || "Administrator"}</p>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-muted hover:text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
