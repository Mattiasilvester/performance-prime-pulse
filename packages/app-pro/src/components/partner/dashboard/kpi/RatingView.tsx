import { Star, CheckCircle } from 'lucide-react';
import { KPIViewHeader } from './KPIViewHeader';
import { KPILineChart } from './charts';

interface RatingData {
  average: number;
  total: number;
  verified: number;
  distribution: Record<number, number>;
  monthlyTrend: Array<{ name: string; value: number }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    text: string;
    date: string;
    author: string;
  }>;
}

interface RatingViewProps {
  data: RatingData;
  onBack: () => void;
}

export function RatingView({ data, onBack }: RatingViewProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-[#EEBA2B] fill-[#EEBA2B]' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <KPIViewHeader title="Recensioni e Rating" onBack={onBack} />

      {/* Rating grande + Distribuzione */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating grande */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="text-center">
            <p className="text-6xl font-bold text-gray-900">{data.average.toFixed(1)}</p>
            <div className="flex justify-center gap-1 mt-2">
              {renderStars(Math.round(data.average))}
            </div>
            <p className="text-gray-500 mt-2">{data.total} recensioni totali</p>
            <div className="flex items-center justify-center gap-1 mt-1 text-green-500">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{data.verified} verificate</span>
            </div>
          </div>
        </div>

        {/* Distribuzione stelle */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Distribuzione</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data.distribution[star] ?? 0;
              const percent = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-12 flex items-center gap-1">
                    {star} <Star className="w-3 h-3 text-[#EEBA2B] fill-[#EEBA2B]" />
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-[#EEBA2B] h-3 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-16 text-right">{count} ({percent}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trend rating */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Trend Rating (6 mesi)</h3>
        <KPILineChart data={data.monthlyTrend} />
      </div>

      {/* Ultime recensioni */}
      {data.recentReviews && data.recentReviews.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Ultime Recensioni</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentReviews.slice(0, 5).map((review) => (
              <div key={review.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm font-medium text-gray-900">{review.author}</span>
                  </div>
                  <span className="text-sm text-gray-400">{review.date}</span>
                </div>
                {review.text && (
                  <p className="text-gray-600 text-sm">{review.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
