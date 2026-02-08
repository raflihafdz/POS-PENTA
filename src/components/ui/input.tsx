import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = "text", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full px-4 py-2.5 border border-gray-200 rounded-xl shadow-sm text-gray-900 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:text-gray-400 transition-all duration-200",
            error && "border-red-400 focus:ring-red-400 focus:border-red-400",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
