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
  // Tracks whether the seller is actively typing here. The sync effect
  // below only skips picking up an external discount change (e.g.
  // checking the pack-promo checkbox, which can update a field that's
  // been sitting empty since it was never touched) while a keystroke is
  // still in progress (e.g. "0" on its way to "0.5"), never once focus
  // has moved on.
  const isFocused = useRef(false);

  useEffect(() => {
    if (isFocused.current) return;
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
        onChange(sanitized === "" ? "0.00" : sanitized);
      }}
      onFocus={(event) => {
        isFocused.current = true;
        event.target.select();
      }}
      onBlur={() => {
        isFocused.current = false;
      }}
    />
  );
}
