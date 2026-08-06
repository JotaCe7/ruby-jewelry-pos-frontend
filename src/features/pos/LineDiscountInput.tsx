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
  // Gated on focus, not on whether the field is currently empty: a
  // discount can also change for reasons that have nothing to do with
  // this field being edited (e.g. checking the pack-promo checkbox
  // recomputes it), and that must still show up even though the field
  // has been sitting empty since it was never touched. Only ignore the
  // prop while the user is actively typing here, so an external change
  // never interrupts an in-progress keystroke (e.g. "0" on its way to "0.5").
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
