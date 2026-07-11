import { useState, useCallback } from 'react';

export function useCalculator() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [newNumber, setNewNumber] = useState(true);

  const handleNum = useCallback((num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  }, [display, newNumber]);

  const handleOp = useCallback((op: string) => {
    setEquation(display + ' ' + op + ' ');
    setNewNumber(true);
  }, [display]);

  const calculate = useCallback(() => {
    try {
      const sanitizedEq = (equation + display).replace(/[^-()\d/*+.]/g, '');
      // eslint-disable-next-line no-eval
      const res = eval(sanitizedEq);
      setDisplay(String(res));
      setEquation('');
      setNewNumber(true);
    } catch {
      setDisplay('Error');
      setNewNumber(true);
    }
  }, [equation, display]);

  const clear = useCallback(() => {
    setDisplay('0');
    setEquation('');
    setNewNumber(true);
  }, []);

  const toggleSign = useCallback(() => {
    setDisplay(display.startsWith('-') ? display.slice(1) : '-' + display);
  }, [display]);

  const percentage = useCallback(() => {
    setDisplay(String(parseFloat(display) / 100));
  }, [display]);

  const handleDecimal = useCallback(() => {
    if (newNumber) {
      setDisplay('0.');
      setNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  }, [display, newNumber]);

  return {
    display,
    equation,
    handleNum,
    handleOp,
    calculate,
    clear,
    toggleSign,
    percentage,
    handleDecimal
  };
}
