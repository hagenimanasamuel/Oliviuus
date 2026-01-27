export default function QuickStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl p-4 h-20"></div>
      ))}
    </div>
  );
}