import { useTranslation } from "react-i18next";

import type { SortField, SortOption } from "./types";

const FIELDS: SortField[] = ["name", "price", "stock", "cost"];

export function SortMenu({ value, onChange }: { value: SortOption; onChange: (sort: SortOption) => void }) {
  const { t } = useTranslation();

  return (
    <select
      className="rounded border border-ruby-700 bg-ruby-900 px-2 py-1.5 text-sm text-blush-100"
      value={`${value.field}:${value.direction}`}
      onChange={(event) => {
        const [field, direction] = event.target.value.split(":") as [SortField, "asc" | "desc"];
        onChange({ field, direction });
      }}
    >
      {FIELDS.map((field) => (
        <optgroup key={field} label={t(`pos.sort.${field}`)}>
          <option value={`${field}:asc`}>{t(`pos.sort.${field}`)} ↑</option>
          <option value={`${field}:desc`}>{t(`pos.sort.${field}`)} ↓</option>
        </optgroup>
      ))}
    </select>
  );
}
