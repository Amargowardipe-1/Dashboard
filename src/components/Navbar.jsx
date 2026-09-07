'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTheme, setActiveView, setSearchQuery } from '@/store/uiSlice';
import { updateProfile } from '@/store/adminSlice';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/auth.api';
import { notificationsApi } from '@/services/notifications.api';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut, 
  Check, 
  CheckCheck
} from 'lucide-react';

export default function Navbar() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { theme, searchQuery } = useSelector((state) => state.ui);
  const { profile } = useSelector((state) => state.admin);

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch admin profile details from database
  const { data: dbProfile } = useQuery({
    queryKey: ['adminProfile'],
    queryFn: () => authApi.getProfile()
  });

  useEffect(() => {
    if (dbProfile) {
      dispatch(updateProfile({
        name: dbProfile.fullName,
        email: dbProfile.email,
        role: dbProfile.role === 'super_admin' ? 'Super Administrator' : 'Administrator',
        avatar: dbProfile.fullName ? dbProfile.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'A'
      }));
    }
  }, [dbProfile, dispatch]);

  // Fetch real notifications using React Query
  const { data: dbNotifications = [] } = useQuery({
    queryKey: ['notificationsList'],
    queryFn: () => notificationsApi.getNotifications(),
    refetchInterval: 15000 // poll notifications every 15s
  });

  const notifications = dbNotifications.map(notif => ({
    id: notif._id,
    text: notif.title ? `${notif.title}: ${notif.body}` : notif.body,
    read: notif.read,
    time: notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() + ' ' + new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  }));

  const unreadCount = notifications.filter(n => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationsList']);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      // Loop over unread and mark them read since backend lacks a bulk read route, or clear all.
      // Wait, backend has DELETE /api/notifications which clears all.
      // But for marking read, we mark individual ones. Let's do it or call notificationsApi.clearAll() if needed.
      // Actually we can just run clearAll or map individual markAsRead.
      const unreads = dbNotifications.filter(n => !n.read);
      await Promise.all(unreads.map(n => notificationsApi.markAsRead(n._id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationsList']);
    }
  });

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  };

  const handleSearchChange = (e) => {
    dispatch(setSearchQuery(e.target.value));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6 shadow-sm">
      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search transactions, users, settings..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-muted/50 focus:bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px] transition-transform rotate-0 scale-100" />
          ) : (
            <Moon className="h-[18px] w-[18px] transition-transform rotate-0 scale-100" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className={`relative flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200
              ${notifDropdownOpen ? 'bg-secondary text-foreground' : ''}
            `}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/40">
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-medium text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => !notif.read && markReadMutation.mutate(notif.id)}
                      className={`flex flex-col gap-1 p-3.5 hover:bg-muted/50 cursor-pointer transition-colors relative
                        ${!notif.read ? 'bg-primary/5' : ''}
                      `}
                    >
                      {!notif.read && (
                        <span className="absolute left-2 top-4 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                      <p className={`text-xs leading-relaxed pl-2 ${!notif.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {notif.text}
                      </p>
                      <span className="text-[10px] text-muted-foreground pl-2">{notif.time}</span>
                    </div>
                  ))
                )}
              </div>
              
              <div className="border-t border-border p-2 bg-muted/20 text-center">
                <button 
                  onClick={() => {
                    dispatch(setActiveView('notifications'));
                    setNotifDropdownOpen(false);
                  }}
                  className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground py-1 transition-colors"
                >
                  View all notification history
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-border p-1.5 pr-2.5 hover:bg-secondary transition-all duration-200"
          >
            <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20 shrink-0">
              {profile.avatar}
            </div>
            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground hidden md:inline-block max-w-[80px] truncate">
              {profile.name}
            </span>
            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-56 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="border-b border-border px-4 py-3 bg-muted/40">
                <p className="text-xs font-semibold text-foreground truncate">{profile.name}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{profile.email}</p>
              </div>
              
              <div className="p-1.5 space-y-1">
                <button
                  onClick={() => {
                    dispatch(setActiveView('profile'));
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  <User size={14} />
                  My Profile
                </button>
                <button
                  onClick={() => {
                    dispatch(setActiveView('settings'));
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  <Settings size={14} />
                  Account Settings
                </button>
              </div>
              
              <div className="border-t border-border p-1.5">
                <button
                  onClick={async () => {
                    await authApi.logout();
                    window.location.href = '/login';
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
