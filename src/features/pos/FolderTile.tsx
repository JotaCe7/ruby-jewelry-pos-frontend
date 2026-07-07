export function FolderTile({
  name,
  image,
  onClick,
}: {
  name: string;
  image: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-lg border border-ruby-800 bg-ruby-900 text-left hover:border-ruby-500 active:scale-[0.98]"
    >
      <div className="flex aspect-square items-center justify-center bg-ruby-950 text-blush-100/30">
        {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span className="text-3xl">📁</span>}
      </div>
      <div className="p-2">
        <p className="truncate text-sm font-medium text-blush-100">{name}</p>
      </div>
    </button>
  );
}
