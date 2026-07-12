"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "./utils"
import { Button } from "./button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface TimePicker24hProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readOnly?: boolean | undefined;
}

export function TimePicker24h({ value, onChange, className, readOnly }: TimePicker24hProps) {
  const [open, setOpen] = React.useState(false)

  if (readOnly) {
    return (
      <div
        className={cn(
          "h-7 w-full flex items-center justify-between text-[11px] font-bold px-2 py-0 border border-gray-300 bg-gray-50 text-gray-700 cursor-default",
          className
        )}
      >
        {value || "00:00"}
        <Clock className="h-3.5 w-3.5 opacity-30" />
      </div>
    );
  }

  // parse current value or default to 00:00
  const [hour, minute] = React.useMemo(() => {
    if (!value || !value.includes(':')) return ["00", "00"];
    const parts = value.split(':');
    const h = (parts[0] || "00").padStart(2, '0');
    const m = (parts[1] || "00").padStart(2, '0');
    return [h, m];
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-7 w-full justify-between text-[11px] font-bold px-2 py-0 border-gray-300 bg-white hover:bg-gray-50 transition-colors",
            className
          )}
        >
          {value || "00:00"}
          <Clock className="ml-1 h-3.5 w-3.5 opacity-50 text-blue-600" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[160px] p-3 shadow-xl border-blue-100" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase text-center">Hrs</label>
              <select 
                value={hour} 
                onChange={(e) => onChange(`${e.target.value}:${minute}`)}
                className="w-full border border-gray-200 rounded-md h-9 text-sm font-bold px-1 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <span className="text-sm font-bold mt-4">:</span>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase text-center">Min</label>
              <select 
                value={minute} 
                onChange={(e) => onChange(`${hour}:${e.target.value}`)}
                className="w-full border border-gray-200 rounded-md h-9 text-sm font-bold px-1 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                {minutes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <Button 
              className="w-full h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all" 
              onClick={() => setOpen(false)}
          >
            Set Time
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
