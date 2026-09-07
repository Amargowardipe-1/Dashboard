'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveView, toggleSidebar } from '@/store/uiSlice';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  CalendarRange, 
  CreditCard, 
  TrendingUp, 
  FileText, 
  Bell, 
  Cpu, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  Ticket,
  HelpCircle
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'plans', label: 'Plans', icon: Layers },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'subscriptions', label: 'Subscriptions', icon: CalendarRange },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'support-queries', label: 'Support Queries', icon: HelpCircle },
  { id: 'ai-usage', label: 'AI Usage', icon: Cpu },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const { sidebarCollapsed, activeView } = useSelector((state) => state.ui);
  const { profile } = useSelector((state) => state.admin);

  return (
    <aside 
      className={`fixed top-0 left-0 z-40 h-screen border-r border-border bg-card text-card-foreground transition-all duration-300 ease-in-out flex flex-col justify-between
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Sidebar Header */}
      <div>
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shrink-0 shadow-md shadow-primary/20">
              E
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                ExpenseAI
              </span>
            )}
          </div>
          
          <button 
            onClick={() => dispatch(toggleSidebar())}
            className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="space-y-1.5 p-3">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => dispatch(setActiveView(item.id))}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }
                `}
              >
                <Icon size={18} className={`shrink-0 transition-transform duration-200 group-hover:scale-105`} />
                {!sidebarCollapsed && <span>{item.label}</span>}
                
                {/* Collapsed Tooltip */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-md border border-border shrink-0 z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin Profile bottom section */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div 
          onClick={() => dispatch(setActiveView('profile'))}
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-secondary cursor-pointer transition-colors group relative overflow-hidden`}
        >
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 border border-primary/20">
            {profile.avatar}
          </div>
          
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                {profile.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile.role}
              </p>
            </div>
          )}

          {sidebarCollapsed && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-md border border-border z-50 whitespace-nowrap">
              {profile.name} ({profile.role})
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
