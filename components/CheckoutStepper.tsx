"use client";
import { Check } from "lucide-react";

const DEFAULT_STEPS = ["Review Order", "Shipping Details", "Payment", "Confirmation"];

export default function CheckoutStepper({ currentStep, steps = DEFAULT_STEPS }) {
  return (
    <div className="flex items-center justify-center mb-10 px-2">
      <div className="flex items-center w-full max-w-2xl">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isFuture = stepNum > currentStep;

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center relative">
                <div
                  className={`
                    relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2
                    transition-all duration-500
                    ${isCompleted ? 'bg-gold border-gold text-white' : ''}
                    ${isCurrent ? 'border-gold bg-background text-gold' : ''}
                    ${isFuture ? 'border-border bg-background text-muted' : ''}
                  `}
                  style={isCurrent ? { boxShadow: '0 0 0 4px rgba(201,169,110,0.15)' } : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 check-anim" strokeWidth={3} />
                  ) : (
                    <span className={`text-xs font-black ${isCurrent ? 'text-gold' : 'text-muted'}`}>
                      {stepNum}
                    </span>
                  )}
                  {isCurrent && <span className="absolute inset-0 rounded-full animate-ping bg-gold/20" />}
                </div>
                <span
                  className={`
                    mt-2 text-[10px] font-bold uppercase tracking-widest text-center leading-tight max-w-[80px]
                    ${isCompleted || isCurrent ? 'text-gold-dark' : 'text-muted'}
                    hidden sm:block
                  `}
                >
                  {label}
                </span>
                <span
                  className={`
                    mt-1 text-[7px] font-bold uppercase tracking-widest text-center
                    ${isCompleted || isCurrent ? 'text-gold-dark' : 'text-muted'}
                    sm:hidden
                  `}
                >
                  {label.length > 7 ? label.slice(0, 5) + '\u2026' : label}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 sm:mx-4 relative">
                  <div className="absolute inset-0 bg-border rounded-full" />
                  <div
                    className={`absolute inset-y-0 left-0 bg-gold rounded-full transition-all duration-700 ease-out ${
                      isCompleted ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
