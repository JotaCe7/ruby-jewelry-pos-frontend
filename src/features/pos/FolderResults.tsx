import { FolderTile } from "./FolderTile";
import type { ViewMode } from "./ProductResults";

interface FolderItem {
  id: number;
  name: string;
  image: string | null;
}

export function FolderResults({
  items,
  viewMode,
  onSelect,
}: {
  items: FolderItem[];
  viewMode: ViewMode;
  onSelect: (item: FolderItem) => void;
}) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <FolderTile key={item.id} name={item.name} image={item.image} onClick={() => onSelect(item)} />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded border border-ruby-800">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          className="flex w-full items-center gap-3 border-b border-ruby-800 px-2 py-2 text-left hover:bg-ruby-900 active:bg-ruby-800"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-ruby-950 text-blush-100/30">
            {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <span>📁</span>}
          </div>
          <p className="flex-1 truncate text-sm font-medium text-blush-100">{item.name}</p>
        </button>
      ))}
    </div>
  );
}
