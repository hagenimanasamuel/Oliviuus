export default function TabContentSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}