import React from 'react';
import { useCalculator } from './useCalculator';
import './Calculator.css';

export function Calculator({ windowId }: { windowId: string }) {
  const {
    display,
    equation,
    handleNum,
    handleOp,
    calculate,
    clear,
    toggleSign,
    percentage,
    handleDecimal
  } = useCalculator();

  return (
    <div className="calculator-app">
      <div className="calc-display">
        <div className="calc-equation">{equation}</div>
        <div className="calc-value">{display}</div>
      </div>
      <div className="calc-buttons">
        <button className="calc-btn-action" onClick={clear}>C</button>
        <button className="calc-btn-action" onClick={toggleSign}>±</button>
        <button className="calc-btn-action" onClick={percentage}>%</button>
        <button className="calc-btn-op" onClick={() => handleOp('/')}>÷</button>
        
        <button className="calc-btn-num" onClick={() => handleNum('7')}>7</button>
        <button className="calc-btn-num" onClick={() => handleNum('8')}>8</button>
        <button className="calc-btn-num" onClick={() => handleNum('9')}>9</button>
        <button className="calc-btn-op" onClick={() => handleOp('*')}>×</button>
        
        <button className="calc-btn-num" onClick={() => handleNum('4')}>4</button>
        <button className="calc-btn-num" onClick={() => handleNum('5')}>5</button>
        <button className="calc-btn-num" onClick={() => handleNum('6')}>6</button>
        <button className="calc-btn-op" onClick={() => handleOp('-')}>-</button>
        
        <button className="calc-btn-num" onClick={() => handleNum('1')}>1</button>
        <button className="calc-btn-num" onClick={() => handleNum('2')}>2</button>
        <button className="calc-btn-num" onClick={() => handleNum('3')}>3</button>
        <button className="calc-btn-op" onClick={() => handleOp('+')}>+</button>
        
        <button className="calc-btn-num calc-zero" onClick={() => handleNum('0')}>0</button>
        <button className="calc-btn-num" onClick={handleDecimal}>.</button>
        <button className="calc-btn-equal" onClick={calculate}>=</button>
      </div>
    </div>
  );
}
