import type { Editor } from '@tiptap/react';

// 将 Tiptap 编辑器内容转换为 Markdown
export function editorToMarkdown(editor: Editor): string {
  // 获取 HTML 内容
  const html = editor.getHTML();

  // 简单的 HTML 到 Markdown 转换
  const markdown = html
    // 标题
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    // 粗体和斜体
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // 删除线
    .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~')
    // 代码
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    // 链接
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // 图片
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')
    // 引用
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_, content) => {
      return content.replace(/<p[^>]*>(.*?)<\/p>/gi, '> $1\n').trim() + '\n\n';
    })
    // 无序列表
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, content) => {
      return (
        content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n').trim() + '\n\n'
      );
    })
    // 有序列表
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => {
      let index = 0;
      return (
        content
          .replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
            index++;
            return `${index}. $1\n`;
          })
          .trim() + '\n\n'
      );
    })
    // 任务列表
    .replace(/<li[^>]*data-checked="true"[^>]*>(.*?)<\/li>/gi, '- [x] $1\n')
    .replace(/<li[^>]*data-checked="false"[^>]*>(.*?)<\/li>/gi, '- [ ] $1\n')
    // 代码块
    .replace(
      /<pre[^>]*><code[^>]*class="language-([^"]*)"[^>]*>(.*?)<\/code><\/pre>/gis,
      '```$1\n$2\n```\n\n'
    )
    .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n')
    // 分割线
    .replace(/<hr[^>]*\/?>/gi, '\n---\n\n')
    // 段落
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // 换行
    .replace(/<br[^>]*\/?>/gi, '\n')
    // 清理残留的 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 清理多余的换行
    .replace(/\n{3,}/g, '\n\n')
    // HTML 实体
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();

  return markdown;
}

// 将 Markdown 转换为 HTML（供 Tiptap 使用）
export function markdownToHtml(markdown: string): string {
  let html = markdown
    // 代码块（先处理，避免内部内容被其他规则影响）
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const langClass = lang ? ` class="language-${lang}"` : '';
      return `<pre><code${langClass}>${escapeHtml(code.trim())}</code></pre>`;
    })
    // 标题
    .replace(/^###### (.*)$/gm, '<h6>$1</h6>')
    .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
    .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    // 粗体和斜体
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 删除线
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // 图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    // 引用
    .replace(/^> (.*)$/gm, '<blockquote><p>$1</p></blockquote>')
    // 分割线
    .replace(/^---$/gm, '<hr />')
    // 任务列表
    .replace(
      /^- \[x\] (.*)$/gm,
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="true">$1</li></ul>'
    )
    .replace(
      /^- \[ \] (.*)$/gm,
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="false">$1</li></ul>'
    )
    // 无序列表
    .replace(/^- (.*)$/gm, '<ul><li>$1</li></ul>')
    // 有序列表
    .replace(/^\d+\. (.*)$/gm, '<ol><li>$1</li></ol>')
    // 段落（处理剩余的行）
    .replace(/^(?!<[a-z])(.*[^\s])$/gm, '<p>$1</p>');

  // 合并相邻的相同列表
  html = html
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/<\/ol>\s*<ol>/g, '')
    .replace(/<\/blockquote>\s*<blockquote>/g, '');

  return html;
}

// HTML 转义
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 格式化日期
export function formatDate(date: Date | number | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 格式化相对时间
export function formatRelativeTime(date: Date | number | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  return formatDate(date);
}

// 截断文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// 提取文档摘要
export function extractSummary(content: string, maxLength = 200): string {
  // 移除 Markdown 格式
  const plainText = content
    .replace(/^#+\s+/gm, '') // 标题
    .replace(/\*\*|__/g, '') // 粗体
    .replace(/\*|_/g, '') // 斜体
    .replace(/~~(.*?)~~/g, '$1') // 删除线
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // 代码
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 图片
    .replace(/^>\s+/gm, '') // 引用
    .replace(/^[-*+]\s+/gm, '') // 列表
    .replace(/^\d+\.\s+/gm, '') // 有序列表
    .replace(/^---$/gm, '') // 分割线
    .replace(/\n+/g, ' ') // 换行
    .trim();

  return truncateText(plainText, maxLength);
}
