"use client";

import React from "react";
import { User } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { SlackConnectButton } from "@/components/emails/SlackConnectButton";
import { LogOut, Send } from "lucide-react";

export interface HeaderProps {
  user: User;
  onLogout: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white shadow-sm shadow-brand-500/20">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                MailScheduler
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-brand-50 text-brand-700 rounded border border-brand-200/60">
                Dashboard
              </span>
            </div>
          </div>

          {/* Right section: Slack integration, User Profile & Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Slack Connection */}
            <div className="hidden sm:block">
              <SlackConnectButton />
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l sm:border-slate-200">
              <Avatar
                src={user.avatarUrl}
                name={user.name}
                size="md"
                className="ring-2 ring-slate-100"
              />
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {user.name}
                </span>
                <span className="text-xs text-slate-500 leading-tight max-w-[160px] truncate">
                  {user.email}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              aria-label="Logout"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile Slack Row if viewport is small */}
        <div className="sm:hidden pb-2.5 pt-0.5 flex justify-end">
          <SlackConnectButton />
        </div>
      </div>
    </header>
  );
};
