import { InputHTMLAttributes } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.001,
  unit = '',
  onChange,
  formatValue,
  ...props
}: SliderProps) {
  const displayValue = formatValue ? formatValue(value) : value.toFixed(4);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <label className="text-slate-600 font-medium">{label}</label>
        <span className="text-slate-800 font-mono">
          {displayValue} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        {...props}
      />
    </div>
  );
}
