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

/**
 * Valide qu'un nombre est fini et non-NaN
 */
function isValidNumber(value: number): boolean {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);

    // Validation: ignorer les valeurs invalides
    if (!isValidNumber(parsed)) {
      return;
    }

    // Clamper la valeur entre min et max
    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(clamped);
  };

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
        onChange={handleChange}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        {...props}
      />
    </div>
  );
}
