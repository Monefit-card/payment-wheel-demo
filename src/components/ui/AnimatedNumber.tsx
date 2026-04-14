'use client';

import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion';
import { formatCurrency } from '@/lib/payment-math';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: (n: number) => string;
}

export function AnimatedNumber({
  value,
  className = '',
  format = formatCurrency,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(format(value));
  const prevValue = useRef(value);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    if (from === to) {
      setDisplay(format(to));
      return;
    }

    const controls = animate(from, to, {
      duration: 0.5,
      ease: [0.32, 0.72, 0, 1],
      onUpdate(latest) {
        setDisplay(format(latest));
      },
      onComplete() {
        setDisplay(format(to));
      },
    });

    return () => controls.stop();
  }, [value, format]);

  return <span className={className}>{display}</span>;
}
