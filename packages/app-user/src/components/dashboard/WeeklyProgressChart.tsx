import { memo } from 'react';
import type { WeeklyData } from './WeeklyProgress';

type WeeklyProgressChartProps = {
  data: WeeklyData[];
};

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const BAR_MAX_HEIGHT = 100;
const BAR_MIN_HEIGHT = 8;
const CONTAINER_HEIGHT = 100;

const WeeklyProgressChart = ({ data }: WeeklyProgressChartProps) => {
  const todayIndex = (new Date().getDay() + 6) % 7;
  const maxWorkouts = Math.max(1, ...data.map((d) => d.workouts));

  const getBarHeight = (workouts: number) => {
    if (workouts === 0) return BAR_MIN_HEIGHT;
    return BAR_MIN_HEIGHT + (workouts / maxWorkouts) * (CONTAINER_HEIGHT - BAR_MIN_HEIGHT);
  };

  return (
    <div className="flex justify-between items-end gap-2" style={{ height: CONTAINER_HEIGHT }}>
      {(data.length ? data : WEEK_DAYS.map((name) => ({ name, workouts: 0 }))).map((day, index) => {
        const workouts = day.workouts ?? 0;
        const isToday = index === todayIndex;
        const isCompleted = workouts > 0;
        const height = getBarHeight(workouts);

        let barStyle: React.CSSProperties = {
          width: '100%',
          maxWidth: 32,
          minHeight: BAR_MIN_HEIGHT,
          height,
          borderRadius: 6,
          margin: '0 auto',
        };

        if (isCompleted) {
          barStyle = {
            ...barStyle,
            background: 'linear-gradient(to bottom, #34D399 0%, #10B981 100%)',
            opacity: 1,
          };
        } else if (isToday) {
          barStyle = {
            ...barStyle,
            background: 'linear-gradient(to bottom, #F5D060 0%, #EEBA2B 100%)',
            opacity: 0.7,
          };
        } else {
          barStyle = {
            ...barStyle,
            backgroundColor: '#1E1E24',
            opacity: 0.3,
          };
        }

        return (
          <div key={day.name} className="flex-1 flex flex-col items-center min-w-0">
            <div style={barStyle} className="w-full" />
            <span
              className={`text-[11px] mt-1.5 ${
                isToday ? 'font-bold text-[#F0EDE8]' : 'font-medium text-[#5C5C66]'
              }`}
            >
              {day.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default memo(WeeklyProgressChart);
