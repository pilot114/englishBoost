/**
 * Подготовка текста для режима чтения.
 *
 * Книги бывают на сотни тысяч символов, поэтому текст режется на страницы:
 * в DOM живёт только текущая страница, а не десятки тысяч <span>.
 */

export const PAGE_SIZE = 1800

/** абзацы: пустые строки выкидываем, остальное чистим по краям */
export function splitParagraphs(text) {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/** абзац длиннее страницы режем по границам слов */
function hardSplit(paragraph, pageSize) {
  const chunks = []
  let rest = paragraph

  while (rest.length > pageSize) {
    let cut = rest.lastIndexOf(' ', pageSize)
    if (cut <= 0) {
      cut = pageSize
    }
    chunks.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) {
    chunks.push(rest)
  }
  return chunks
}

/**
 * Собирает абзацы в страницы примерно по pageSize символов.
 * Возвращает массив страниц, каждая — массив абзацев.
 */
export function paginate(text, pageSize = PAGE_SIZE) {
  const pages = []
  let current = []
  let size = 0

  splitParagraphs(text).forEach((paragraph) => {
    const chunks = paragraph.length > pageSize ? hardSplit(paragraph, pageSize) : [paragraph]

    chunks.forEach((chunk) => {
      if (size + chunk.length > pageSize && current.length) {
        pages.push(current)
        current = []
        size = 0
      }
      current.push(chunk)
      size += chunk.length
    })
  })

  if (current.length) {
    pages.push(current)
  }
  return pages.length ? pages : [[]]
}

/**
 * Режет строку на токены: слова языка и всё, что между ними.
 * word — нормализованный ключ для поиска в словаре, у не-слов он null.
 */
export function tokenize(text, wordPattern) {
  const tokens = []
  let last = 0
  let wordIndex = 0

  for (const match of text.matchAll(wordPattern)) {
    if (match.index > last) {
      tokens.push({ text: text.slice(last, match.index), word: null })
    }
    // wi — порядковый номер слова в абзаце, по нему выделяют диапазон для фразы
    tokens.push({ text: match[0], word: match[0].toLowerCase(), wi: wordIndex++ })
    last = match.index + match[0].length
  }
  if (last < text.length) {
    tokens.push({ text: text.slice(last), word: null })
  }
  return tokens
}

/** ключ фразы: слова в нижнем регистре через один пробел */
export function phraseKey(words) {
  return words.map((word) => word.toLowerCase()).join(' ')
}

/**
 * 53-битный хэш строки (cyrb53).
 *
 * 53 бита — предел точности числа в JS. Ширина взята не с запасом: на 32 битах
 * пара разных предложений с одинаковым хэшем встретилась бы уже на десятке тысяч
 * записей (парадокс дней рождения), а коллизия здесь означает чужой перевод в
 * карточке — молча и без возможности заметить.
 */
function cyrb53(text) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ code, 2654435761)
    h2 = Math.imul(h2 ^ code, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/**
 * Ключ предложения для кэша переводов.
 *
 * Само предложение ключом не годится: кэш лежит в localStorage рядом с текстами
 * и словарями, а там место общее и небесконечное. Хэш даёт полтора десятка
 * символов независимо от длины предложения.
 *
 * Переносы строк схлопываем: одно и то же предложение в разной вёрстке страницы
 * не должно переводиться дважды.
 */
export function sentenceKey(text) {
  return cyrb53(
    String(text ?? '')
      .replace(/\s+/g, ' ')
      .trim(),
  ).toString(36)
}

/** выделенный кусок текста -> ключ фразы, посторонние символы отбрасываются */
export function phraseFromSelection(text, wordPattern) {
  return phraseKey([...String(text ?? '').matchAll(wordPattern)].map((match) => match[0]))
}

/** сколько раз последовательность слов встречается в тексте — это частота фразы */
export function countSequence(words, sequence) {
  if (!sequence.length || sequence.length > words.length) {
    return 0
  }

  let count = 0
  for (let i = 0; i + sequence.length <= words.length; i++) {
    if (sequence.every((word, k) => words[i + k] === word)) {
      count++
    }
  }
  return count
}

const SENTENCE_END = /[.!?…]/

/**
 * Группирует токены абзаца в предложения.
 *
 * Граница — разделитель с точкой, восклицательным или вопросительным знаком.
 * Правило намеренно простое: сокращения вроде «Mr. Smith» оно разорвёт, но для
 * читалки цена ошибки — лишняя граница, а не потеря текста.
 */
export function splitSentences(tokens) {
  const groups = []
  let current = null

  tokens.forEach((token) => {
    if (!current) {
      current = []
      groups.push(current)
    }
    current.push(token)

    if (!token.word && SENTENCE_END.test(token.text)) {
      current = null
    }
  })

  return groups
    .filter((group) => group.some((token) => token.text.trim()))
    .map((group, index) => {
      // si проставляем после отсева пустых групп, чтобы индексы шли подряд
      group.forEach((token) => (token.si = index))
      return {
        index,
        tokens: group,
        text: group
          .map((token) => token.text)
          .join('')
          .trim(),
      }
    })
}

/** ключи фраз из словаря, встречающихся в предложении, в порядке появления */
export function sentencePhrases(sentence) {
  const keys = []

  sentence.tokens.forEach((token) => {
    if (token.phrase && !keys.includes(token.phrase)) {
      keys.push(token.phrase)
    }
  })
  return keys
}

/**
 * Индекс фраз для быстрого поиска в тексте: первое слово -> варианты продолжения.
 * Длинные фразы идут первыми, чтобы при пересечении побеждало полное совпадение.
 */
export function buildPhraseIndex(keys) {
  const index = new Map()

  keys.forEach((key) => {
    const words = key.split(' ').filter(Boolean)
    if (!words.length) {
      return
    }
    const bucket = index.get(words[0]) ?? []
    bucket.push({ key, words })
    index.set(words[0], bucket)
  })

  index.forEach((bucket) => bucket.sort((a, b) => b.words.length - a.words.length))
  return index
}

/** проставляет токенам поле phrase, если они входят в известную фразу */
export function markPhrases(tokens, index) {
  if (!index.size) {
    return tokens
  }

  const positions = []
  tokens.forEach((token, i) => {
    if (token.word) {
      positions.push(i)
    }
  })

  for (let w = 0; w < positions.length; w++) {
    const candidates = index.get(tokens[positions[w]].word)
    if (!candidates) {
      continue
    }

    const hit = candidates.find(
      ({ words }) =>
        w + words.length <= positions.length && words.every((word, k) => tokens[positions[w + k]].word === word),
    )
    if (!hit) {
      continue
    }

    hit.words.forEach((_, k) => (tokens[positions[w + k]].phrase = hit.key))
    w += hit.words.length - 1
  }
  return tokens
}
