import { Star } from 'lucide-react';

// 27crags ratings are on a 0–3 scale.
export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle">
      {[0, 1, 2].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-slate-600" strokeWidth={1.5} />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star size={size} className="text-amber-400 fill-amber-400" strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
