export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">設定</h1>
        <p className="text-muted-foreground">アプリケーションの設定を管理します</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background p-4">
          <h2 className="mb-2 text-lg font-semibold">プロフィール</h2>
          <p className="text-sm text-muted-foreground">
            認証機能は今後実装予定です
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h2 className="mb-2 text-lg font-semibold">通知</h2>
          <p className="text-sm text-muted-foreground">
            通知設定は今後実装予定です
          </p>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h2 className="mb-2 text-lg font-semibold">データ管理</h2>
          <p className="text-sm text-muted-foreground">
            データのエクスポート・削除機能は今後実装予定です
          </p>
        </div>
      </div>
    </div>
  );
}
