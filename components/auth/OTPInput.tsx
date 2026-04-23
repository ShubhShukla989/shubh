'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export default function OTPInput({ 
  length = 6, 
  value, 
  onChange, 
  disabled = false, 
  error = false,
  autoFocus = false 
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Update internal state when value prop changes
  useEffect(() => {
    const otpArray = value.split('').slice(0, length);
    while (otpArray.length < length) {
      otpArray.push('');
    }
    setOtp(otpArray);
  }, [value, length]);

  // Auto focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, digit: string) => {
    // Only allow digits
    if (digit && !/^\d$/.test(digit)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Move to next input if digit is entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      
      if (otp[index]) {
        // Clear current input
        newOtp[index] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
    
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Handle delete key
    else if (e.key === 'Delete') {
      e.preventDefault();
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      onChange(newOtp.join(''));
    }
  };

  const handleFocus = (index: number) => {
    // Select all text when input is focused
    inputRefs.current[index]?.select();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    
    // Only process if pasted data contains only digits
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    const pastedDigits = pastedData.slice(0, length).split('');
    const newOtp = [...otp];
    
    pastedDigits.forEach((digit, index) => {
      if (index < length) {
        newOtp[index] = digit;
      }
    });
    
    setOtp(newOtp);
    onChange(newOtp.join(''));
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="\d{1}"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`
            w-12 h-12 text-center text-xl font-bold border-2 rounded-lg
            transition-all duration-200 ease-in-out
            ${error 
              ? 'border-red-500 bg-red-50 text-red-900' 
              : 'border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200'
            }
            ${disabled 
              ? 'bg-gray-100 cursor-not-allowed opacity-50' 
              : 'bg-white hover:border-gray-400'
            }
            focus:outline-none
          `}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
}