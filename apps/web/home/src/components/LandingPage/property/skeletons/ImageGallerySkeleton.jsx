export default function ImageGallerySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative h-[300px] sm:h-[350px] md:h-[400px] lg:h-[500px] xl:h-[550px] rounded-2xl overflow-hidden bg-gray-200"></div>
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-200"></div>
        ))}
      </div>
    </div>
  );
}