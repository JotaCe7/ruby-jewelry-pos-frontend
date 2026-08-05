import { useEffect, useRef, useState } from "react";

export function LineQuantityInput({
  quantity,
  className,
  onChange,
}: {
  quantity: number;
  className: string;
  onChange: (quantity: number) => void;
}) {
  const [text, setText] = useState(String(quantity));
  const isEmpty = useRef(false);

  useEffect(() => {
    // Never clobber an intentionally-cleared field (see onChange below);
    // the quantity is already committed as 1 the moment it's emptied.
    if (isEmpty.current) return;
    setText(String(quantity));
  }, [quantity]);

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder="1"
      className={className}
      value={text}
      onChange={(event) => {
        const digits = event.target.value.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
        isEmpty.current = digits === "";
        setText(digits);
        onChange(digits === "" ? 1 : Math.max(1, Number(digits)));
      }}
      onFocus={(event) => event.target.select()}
    />
  );
}
