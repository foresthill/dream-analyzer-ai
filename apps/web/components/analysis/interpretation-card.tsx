interface InterpretationCardProps {
  title: string;
  content: string;
  icon?: string;
}

export function InterpretationCard({ title, content, icon }: InterpretationCardProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{content}</p>
    </div>
  );
}
