/**
 * 格式化时间戳为 MM:SS 格式
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 解析 Markdown 内容中的时间轴项目
 * 识别 ## [MM:SS] 标题 的模式
 */
export interface TimelineItem {
  timestamp: number;
  time: string;
  title: string;
  imageUrl?: string;
  sceneDescription: string;
  keyPoints: string[];
  rawContent: string;
}

export function parseTimelineContent(
  markdownContent: string,
  keyframes: Array<{ timestamp: number; imageUrl?: string }>
): TimelineItem[] {
  const items: TimelineItem[] = [];

  // 按 ## [时间] 标题 分割内容
  const sections = markdownContent.split(/^## \[(\d{2}:\d{2})\]/m);

  // sections[0] 是开头（可能为空），之后每两项为：时间、内容
  for (let i = 1; i < sections.length; i += 2) {
    const time = sections[i];
    const content = sections[i + 1] || '';

    // 解析时间为秒
    const [mins, secs] = time.split(':').map(Number);
    const timestamp = mins * 60 + secs;

    // 提取标题（第一行）
    const lines = content.trim().split('\n');
    const title = lines[0]?.trim() || '未命名段落';

    // 提取画面描述（**画面描述**：后面的内容）
    let sceneDescription = '';
    const sceneMatch = content.match(
      /\*\*画面描述\*\*[：:]\s*(.+?)(?=\n\n|\*\*内容要点\*\*|$)/s
    );
    if (sceneMatch) {
      sceneDescription = sceneMatch[1].trim();
    }

    // 提取内容要点（列表项）
    const keyPoints: string[] = [];
    const pointsMatch = content.match(
      /\*\*内容要点\*\*[：:]?\s*([\s\S]*?)(?=\n##|$)/
    );
    if (pointsMatch) {
      const pointsText = pointsMatch[1];
      const listItems = pointsText.match(/^[-*]\s+(.+)$/gm);
      if (listItems) {
        keyPoints.push(
          ...listItems.map((item) => item.replace(/^[-*]\s+/, '').trim())
        );
      }
    }

    // 查找对应的关键帧图片
    const matchedKeyframe = keyframes.find(
      (kf) => Math.abs(kf.timestamp - timestamp) < 5 // 5 秒内匹配
    );

    items.push({
      timestamp,
      time,
      title,
      imageUrl: matchedKeyframe?.imageUrl,
      sceneDescription,
      keyPoints,
      rawContent: content
    });
  }

  return items;
}
