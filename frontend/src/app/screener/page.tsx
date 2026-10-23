import { ScreenerWorkspace } from "@/components/screener/ScreenerWorkspace";

export default function ScreenerPage() {
  return (
    <div className="pointer-events-none h-full w-full overflow-y-auto bg-transparent px-4 pb-6 pl-12 pt-12">
      <div className="pointer-events-auto">
        <ScreenerWorkspace />
      </div>
    </div>
  );
}
