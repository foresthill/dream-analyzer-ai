'use client';

interface SimpleMarkdownProps {
  content: string;
  className?: string;
}

export function SimpleMarkdown({ content, className = '' }: SimpleMarkdownProps) {
  // シンプルなマークダウンをHTMLに変換
  const parseMarkdown = (text: string): string => {
    let html = text;

    // エスケープHTMLタグ
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // コードブロック ```
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="my-2 rounded-md bg-black/10 p-3 overflow-x-auto"><code class="text-sm">${code.trim()}</code></pre>`;
    });

    // インラインコード `code`
    html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-black/10 px-1 py-0.5 text-sm">$1</code>');

    // 見出し
    html = html.replace(/^### (.+)$/gm, '<h3 class="mt-4 mb-2 text-base font-semibold">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="mt-4 mb-2 text-lg font-semibold">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="mt-4 mb-2 text-xl font-bold">$1</h1>');

    // 太字 **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');

    // 斜体 *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // リスト項目 - item
    html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

    // 番号付きリスト 1. item
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

    // 連続するli要素をulでラップ
    html = html.replace(/(<li class="ml-4 list-disc">[\s\S]*?<\/li>)(\n<li class="ml-4 list-disc">)/g, '$1$2');
    html = html.replace(/(<li class="ml-4 list-decimal">[\s\S]*?<\/li>)(\n<li class="ml-4 list-decimal">)/g, '$1$2');

    // 水平線
    html = html.replace(/^---$/gm, '<hr class="my-4 border-border" />');

    // 改行を<br>に変換（段落内の改行）
    html = html.replace(/\n/g, '<br />');

    // 複数の<br>を段落として扱う
    html = html.replace(/(<br \/>){2,}/g, '</p><p class="my-2">');

    return `<p class="my-2">${html}</p>`;
  };

  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}
