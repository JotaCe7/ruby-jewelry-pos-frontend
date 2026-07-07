import { useRef } from "react";
import { useTranslation } from "react-i18next";

export function ImagePicker({
  imageUrl,
  onSelect,
  size = 48,
}: {
  imageUrl: string | null;
  onSelect: (file: File) => void;
  size?: number;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex items-center justify-center overflow-hidden rounded border border-ruby-700 bg-ruby-900 text-blush-100/50 hover:border-ruby-500"
      style={{ width: size, height: size }}
      title={t("common.changeImage")}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs">{t("common.image")}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
          event.target.value = "";
        }}
      />
    </button>
  );
}
