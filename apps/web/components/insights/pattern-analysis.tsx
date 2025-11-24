interface PatternAnalysisProps {
  patterns: Array<{
    pattern: string;
    frequency: number;
    description: string;
  }>;
}

export function PatternAnalysis({ patterns }: PatternAnalysisProps) {
  if (patterns.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        パターンが見つかりませんでした
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {patterns.map((pattern, index) => (
        <div key={index} className="rounded-lg bg-secondary p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium">{pattern.pattern}</span>
            <span className="text-sm text-muted-foreground">
              {pattern.frequency}回
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{pattern.description}</p>
        </div>
      ))}
    </div>
  );
}
