import { Search, Plus, Settings, GripVertical, MoreHorizontal } from "lucide-react";

export default function TermBank() {
  return (
    <aside className="w-72 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Term Bank</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Search + New Term row */}
      <div className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search terms..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" />
          New Term
        </button>
      </div>

      {/* Category */}
      <div className="px-4 pt-2 flex-1">
        <div className="border-t border-gray-100 pt-3">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Weather Terms
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <span className="text-sm font-medium text-gray-700">Rain</span>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
