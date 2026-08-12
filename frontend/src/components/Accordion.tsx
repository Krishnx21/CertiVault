import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
}

export function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="rounded-lg overflow-hidden transition-colors"
            style={{ 
              backgroundColor: "var(--bg-secondary)", 
              border: "1px solid var(--border-color)" 
            }}
          >
            <button
              className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
              id={`accordion-title-${item.id}`}
            >
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {item.title}
              </span>
              <ChevronDown
                size={20}
                style={{ color: "var(--text-muted)" }}
                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            <div
              id={`accordion-content-${item.id}`}
              role="region"
              aria-labelledby={`accordion-title-${item.id}`}
              className={`transition-all duration-300 ease-in-out ${
                isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              } overflow-hidden`}
            >
              <div 
                className="p-4 pt-0 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
