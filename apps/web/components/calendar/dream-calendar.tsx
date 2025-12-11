'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface Dream {
  id: string;
  title: string;
  date: Date;
  mood: string;
  dreamer: {
    name: string;
  };
  analyses: unknown[];
}

interface DreamCalendarProps {
  dreams: Dream[];
}

export function DreamCalendar({ dreams }: DreamCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Create dream map by date
  const dreamsByDate = new Map<string, Dream[]>();
  dreams.forEach((dream) => {
    const dateKey = new Date(dream.date).toLocaleDateString('ja-JP');
    if (!dreamsByDate.has(dateKey)) {
      dreamsByDate.set(dateKey, []);
    }
    dreamsByDate.get(dateKey)!.push(dream);
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderCalendarDays = () => {
    const days = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-2"></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toLocaleDateString('ja-JP');
      const dreamsOnThisDay = dreamsByDate.get(dateKey) || [];
      const isToday =
        date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`aspect-square border border-border p-2 ${
            isToday ? 'bg-primary/10 border-primary' : 'bg-card'
          }`}
        >
          <div className="flex h-full flex-col">
            <div
              className={`mb-1 text-sm font-medium ${
                isToday ? 'text-primary' : 'text-foreground'
              }`}
            >
              {day}
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {dreamsOnThisDay.map((dream) => (
                <Link
                  key={dream.id}
                  href={`/dreams/${dream.id}`}
                  className="block rounded bg-primary/20 px-1 py-0.5 text-xs hover:bg-primary/30 truncate"
                  title={`${dream.dreamer.name}: ${dream.title}`}
                >
                  <div className="truncate font-medium">{dream.title}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {dream.dreamer.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
        <button
          onClick={goToPreviousMonth}
          className="rounded-md px-4 py-2 hover:bg-secondary"
        >
          ← 前月
        </button>
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">
            {year}年 {monthNames[month]}
          </h2>
          <button
            onClick={goToToday}
            className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
          >
            今日
          </button>
        </div>
        <button
          onClick={goToNextMonth}
          className="rounded-md px-4 py-2 hover:bg-secondary"
        >
          次月 →
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border border-border bg-card p-4">
        {/* Day names header */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-semibold">使い方</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-primary bg-primary/10"></div>
            <span>今日の日付はハイライト表示されます</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-primary/20"></div>
            <span>夢が記録されている日には、夢のタイトルが表示されます</span>
          </div>
          <p className="pt-2">💡 夢のタイトルをクリックすると、その夢の詳細ページに移動できます</p>
        </div>
      </div>
    </div>
  );
}
