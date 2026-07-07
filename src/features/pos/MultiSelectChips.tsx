export function MultiSelectChips<T extends { id: number; name: string }>({
  label,
  items,
  selectedIds,
  onChange,
}: {
  label: string;
  items: T[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  function toggle(id: number) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-2">
      <p className="mb-1 text-xs text-blush-100/60">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                isSelected
                  ? "border-ruby-500 bg-ruby-600 text-blush-100"
                  : "border-ruby-700 text-blush-100/70 hover:border-ruby-500"
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
