interface ProgressBarProps {
  translated: number;
  total: number;
}

export default function ProgressBar({ translated, total }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((translated / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-600 whitespace-nowrap">
        {translated} / {total} ({percentage}%)
      </span>
    </div>
  );
}
