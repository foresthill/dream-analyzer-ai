import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center">利用規約</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          最終更新日: 2026年2月17日
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-lg font-semibold">第1条（サービスの概要）</h2>
            <p className="mt-2 text-muted-foreground">
              Dream Analyzer（以下「本サービス」）は、夢の記録・分析を支援する無料のウェブサービスです。
              本サービスはAI技術を活用して夢の内容を分析しますが、医療・心理的な診断や助言を提供するものではありません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">第2条（利用料金）</h2>
            <p className="mt-2 text-muted-foreground">
              本サービスは無料で提供されます。
              ただし、サービスの維持・運営上の理由により、予告なくサービス内容の変更、一時停止、または終了する場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">第3条（個人情報の取り扱い）</h2>
            <p className="mt-2 text-muted-foreground">
              本サービスでは、Google認証を通じて取得するメールアドレスおよび表示名、
              ならびにユーザーが入力した夢の記録データを取得・保存します。
              これらの情報は、サービスの提供および改善の目的でのみ使用し、厳正に管理いたします。
              ただし、第三者への情報提供は原則として行いません。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">第4条（AI分析について）</h2>
            <p className="mt-2 text-muted-foreground">
              本サービスのAI分析結果は、あくまで参考情報として提供されるものです。
              分析結果の正確性・完全性を保証するものではなく、
              医学的・心理学的な専門的判断の代替となるものではありません。
              分析結果に基づく行動はすべてユーザーご自身の判断と責任において行ってください。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">第5条（免責事項）</h2>
            <p className="mt-2 text-muted-foreground">
              本サービスは「現状のまま」で提供され、明示・黙示を問わず、いかなる保証も行いません。
              本サービスの利用により生じた損害について、運営者は一切の責任を負いません。
              これには、データの消失、サービスの中断、AI分析結果に起因する損害を含みますが、これに限りません。
              本サービスの利用はすべてユーザーの自己責任となります。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">第6条（禁止事項）</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
              <li>本サービスの不正利用や、他のユーザーへの迷惑行為</li>
              <li>サービスの運営を妨害する行為</li>
              <li>虚偽の情報を用いたアカウント登録</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">第7条（規約の変更）</h2>
            <p className="mt-2 text-muted-foreground">
              運営者は、必要に応じて本規約を変更することがあります。
              変更後の規約は、本ページに掲載した時点で効力を生じるものとします。
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
