"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Tooltip } from "@/app/components/UI/Tooltip";
import { cn } from "@/app/lib/utils";

export interface ToolbarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  isActive?: boolean;
  onClick: () => void;
}

interface ToolbarFlyoutProps {
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  items: ToolbarItem[];
  /** Whether any item in this group is currently active */
  hasActiveItem?: boolean;
}

export function ToolbarFlyout({
  icon,
  label,
  tooltip,
  items,
  hasActiveItem = false,
}: ToolbarFlyoutProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Tooltip content={tooltip} position="bottom">
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex items-center gap-1 h-7 px-2 text-xs rounded transition-colors",
            "focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none",
            open || hasActiveItem
              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
              : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 border border-slate-700/40"
          )}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={label}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
          <ChevronDown
            className={cn(
              "w-3 h-3 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </Tooltip>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 mt-1 z-50 min-w-[160px] py-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-lg ms-shadow-elevated origin-top"
            role="menu"
            aria-label={`${label} tools`}
          >
            {items.map((item) => (
              <Tooltip key={item.id} content={item.tooltip} position="right">
                <button
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500/50 focus-visible:outline-none",
                    item.isActive
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                  )}
                  role="menuitem"
                  aria-pressed={item.isActive}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </Tooltip>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
