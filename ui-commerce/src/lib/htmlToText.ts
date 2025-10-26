/**
 * Parse HTML sang plain text
 * Xử lý các thẻ HTML phổ biến và giữ format cơ bản
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return '';
  
  let text = html;
  
  // Thay thế các thẻ block bằng line breaks
  text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr)[^>]*>/gi, '\n');
  
  // Thay thế list items
  text = text.replace(/<li[^>]*>/gi, '\n• ');
  
  // Xóa tất cả các thẻ HTML còn lại
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  
  // Xóa nhiều line breaks liên tiếp
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Xóa khoảng trắng thừa
  text = text.replace(/[ \t]+/g, ' ');
  
  // Trim mỗi dòng
  text = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
  
  return text.trim();
}

/**
 * Truncate text với ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

