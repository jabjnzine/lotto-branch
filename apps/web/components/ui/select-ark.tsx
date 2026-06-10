"use client";

import { Portal } from "@ark-ui/react/portal";
import { Select, createListCollection } from "@ark-ui/react/select";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Generic Select ────────────────────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface ArkSelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}

export function ArkSelect({
  label,
  placeholder = "เลือก...",
  options,
  value,
  onValueChange,
  disabled = false,
  clearable = false,
  className,
}: ArkSelectProps) {
  const collection = createListCollection<SelectOption>({
    items: options,
    itemToValue: (item) => item.value,
    itemToString: (item) => item.label,
  });

  const selected = options.find((o) => o.value === value);

  return (
    <Select.Root
      collection={collection}
      value={value ? [value] : []}
      onValueChange={(e) => onValueChange?.(e.value[0] ?? null)}
      disabled={disabled}
    >
      {label && (
        <Select.Label className="block text-xs font-medium text-slate-600 mb-1">
          {label}
        </Select.Label>
      )}
      <Select.Control className="relative">
        <Select.Trigger
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-slate-800",
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500",
            "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
            "transition-colors",
            className,
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
            <Select.ValueText
              placeholder={placeholder}
              className="truncate"
            />
          </div>
          <Select.Indicator className="shrink-0 ml-2">
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </Select.Indicator>
        </Select.Trigger>
        {clearable && value && (
          <Select.ClearTrigger className="absolute right-8 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1">
            ✕
          </Select.ClearTrigger>
        )}
      </Select.Control>

      <Portal>
        <Select.Positioner className="z-50">
          <Select.Content
            className={cn(
              "min-w-[var(--reference-width)] rounded-md border border-sky-100 bg-white shadow-lg",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "max-h-60 overflow-auto py-1",
            )}
          >
            <Select.ItemGroup>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  item={option}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center gap-2 px-3 py-2 text-sm text-slate-700",
                    "data-highlighted:bg-sky-50 data-highlighted:text-sky-700",
                    "data-[state=checked]:bg-sky-50 data-[state=checked]:text-sky-700",
                    "transition-colors",
                  )}
                >
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <Select.ItemText className="flex-1">{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto">
                    <Check className="h-3.5 w-3.5 text-sky-600" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
              {options.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-slate-400">
                  ไม่มีตัวเลือก
                </div>
              )}
            </Select.ItemGroup>
          </Select.Content>
        </Select.Positioner>
      </Portal>
      <Select.HiddenSelect />
    </Select.Root>
  );
}

// ─── House Select — ใช้งานในหน้าคีย์หวย ────────────────────────────────────

interface House {
  id: string;
  name: string;
  commission_rate: string;
}

interface HouseSelectProps {
  houses: House[] | undefined;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  label?: string;
}

export function HouseSelect({
  houses,
  value,
  onChange,
  disabled,
  label = "บ้าน",
}: HouseSelectProps) {
  const options: SelectOption[] = [
    ...(houses?.map((h) => ({
      label: `${h.name}`,
      value: h.id,
    })) ?? []),
  ];

  return (
    <ArkSelect
      label={label}
      placeholder="— ไม่ระบุ —"
      options={options}
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      clearable
    />
  );
}
