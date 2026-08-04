import { useEffect, useRef, useState } from "react";

function isZero(value: string): boolean {
  return value === "" || Number(value) === 0;
}

export function LineDiscountInput({
  discount,
  className,
  placeholder,
  onChange,
}: {
  discount: string;
  className: string;
  placeholder: string;
  onChange: (discount: string) => void;
}) {
  const [text, setText] = useState(isZero(discount) ? "" : discount);
  const isEmpty = useRef(isZero(discount));

  useEffect(() => {
    // Never clobber an intentionally-cleared field — see onChange below.
    if (isEmpty.current) return;
    setText(isZero(discount) ? "" : discount);
  }, [discount]);

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      className={className}
      value={text}
      onChange={(event) => {
        const digitsAndDot = event.target.value.replace(/[^0-9.]/g, "");
        const firstDot = digitsAndDot.indexOf(".");
        const sanitized =
          firstDot === -1
            ? digitsAndDot
            : digitsAndDot.slice(0, firstDot + 1) + digitsAndDot.slice(firstDot + 1).replace(/\./g, "");
        setText(sanitized);
        isEmpty.current = sanitized === "";
        onChange(sanitized === "" ? "0.00" : sanitized);
      }}
      onFocus={(event) => event.target.select()}
    />
  );
}
