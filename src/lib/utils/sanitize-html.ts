import sanitizeHtml from 'sanitize-html'

/**
 * Разрешённые теги и атрибуты для контента статей, создаваемого через TinyMCE.
 * Список покрывает стандартное форматирование rich-text редактора: заголовки,
 * списки, таблицы, изображения, ссылки, встраивание файлов из файлового менеджера.
 */
const ARTICLE_ALLOWED_TAGS = [
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'span', 'div',
  'figure', 'figcaption',
]

const ARTICLE_ALLOWED_ATTR = ['style', 'class', 'title']

/**
 * Санитизирует HTML-контент статьи, удаляя потенциально опасные конструкции
 * (script, onerror, javascript:-ссылки и т.д.), сохраняя разметку форматирования.
 *
 * Вызывается на сервере перед сохранением (createArticle/updateArticle) — это
 * основной барьер против stored XSS. Дополнительный вызов на выводе (RichTextContent)
 * защищает данные, попавшие в БД до внедрения санитизации.
 */
export function sanitizeArticleHtml(html: string): string {
  if (!html) return ''

  return sanitizeHtml(html, {
    allowedTags: ARTICLE_ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel', ...ARTICLE_ALLOWED_ATTR],
      img: ['src', 'alt', 'width', 'height', 'loading', ...ARTICLE_ALLOWED_ATTR],
      td: ['colspan', 'rowspan', ...ARTICLE_ALLOWED_ATTR],
      th: ['colspan', 'rowspan', ...ARTICLE_ALLOWED_ATTR],
      '*': ARTICLE_ALLOWED_ATTR,
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      // data: разрешён только для изображений, вставленных из TinyMCE как base64
      img: ['http', 'https', 'data'],
    },
    // Ссылки, открывающиеся в новой вкладке (target="_blank"), должны получать
    // rel="noopener noreferrer" — иначе открытая страница получает доступ к window.opener
    // (reverse tabnabbing). TinyMCE вставляет target="_blank" без rel, поэтому достраиваем сами.
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target === '_blank'
          ? { ...attribs, rel: 'noopener noreferrer' }
          : attribs,
      }),
    },
  })
}
