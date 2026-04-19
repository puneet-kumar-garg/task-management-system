export const SkeletonCard = () => (
  <div className="card space-y-3">
    <div className="flex items-center gap-3">
      <div className="skeleton w-5 h-5 rounded-full" />
      <div className="skeleton h-4 flex-1 rounded" />
      <div className="skeleton h-4 w-16 rounded" />
    </div>
    <div className="skeleton h-3 w-3/4 rounded" />
    <div className="flex gap-2">
      <div className="skeleton h-5 w-14 rounded-full" />
      <div className="skeleton h-5 w-20 rounded-full" />
    </div>
  </div>
);

export const SkeletonStat = () => (
  <div className="card flex items-center gap-4">
    <div className="skeleton w-12 h-12 rounded-xl" />
    <div className="space-y-2">
      <div className="skeleton h-6 w-12 rounded" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);
