import { defineStore } from 'pinia'
import { DEFAULT_LANGUAGE, getLanguage, LANGUAGES } from '@/domain/languages'
import { basicDictionary, basicEntries, BUILTIN_DICT_ID, getBasics } from '@/domain/basics'
import { sentenceKey } from '@/domain/reader'
import { translateAll } from '@/domain/translator'

/**
 * get part of object
 *
 * data = { a: 1, b: 2, c: 3, d: 4}
 * res = subset(data, (k,v) => v % 2)
 * // res: { a: 1, c: 3}
 */
function subset(obj, filterFn) {
  const filteredEntries = Object.entries(obj).filter(([key, value]) => filterFn(key, value))
  return Object.fromEntries(filteredEntries)
}

export const MIN_FONT_SIZE = 14
export const MAX_FONT_SIZE = 26

/**
 * Сколько переводов предложений держим на язык.
 *
 * Кэш делит localStorage с текстами и словарями, поэтому расти бесконечно ему
 * нельзя: переполнение хранилища убило бы всё сохранение целиком, а не только
 * кэш. Тысячи предложений хватает на несколько книг подряд.
 */
export const SENTENCE_CACHE_LIMIT = 2000

function getMaxByField(obj, field, limit) {
  const entries = Object.entries(obj)
  entries.sort(([, a], [, b]) => b[field] - a[field])
  return entries.slice(0, limit).map(([key]) => key)
}

/** что изучаем: отдельные слова или устойчивые выражения */
export const WORD = 'word'
export const PHRASE = 'phrase'

/**
 * Слова, фразы, словари и архивы хранятся отдельно для каждого изучаемого языка,
 * чтобы английская и сербская лексика не смешивались в одном пуле.
 *
 * Слова и фразы живут в разных пулах, но проходят один и тот же цикл повторений,
 * поэтому вся механика уровней работает с пулом, выбранным по режиму.
 */
/** разбор текста на слова по алфавиту языка — тем же правилом, что и действие parse */
function parseWith(code, text) {
  const { letters } = getLanguage(code)
  const words = text
    .split(/[\s,.!?]+/)
    .map((x) => x.trim())
    .map((x) => x.replace(letters, '').toLowerCase())
    .filter((x) => x)

  const frequency = {}
  words.forEach((x) => (frequency[x] = (frequency[x] || 0) + 1))
  return { text, words, frequency }
}

/**
 * Пул слов из словарей. Уже известное (базовая лексика, выученное) в очередь не
 * попадает: иначе сотня артиклей и предлогов забила бы всё обучение.
 */
function poolFromDictionaries(dictionaries, archive, previous = {}) {
  const pool = {}

  dictionaries.forEach((dict) => {
    Object.entries(dict.frequency ?? {}).forEach(([word, count]) => {
      if (archive[word]) {
        return
      }
      pool[word] = {
        frequency: (pool[word]?.frequency ?? 0) + count,
        ru: previous[word]?.ru ?? null,
        level: 0,
      }
    })
  })
  return pool
}

function emptyLanguageState(code = DEFAULT_LANGUAGE) {
  const basics = getBasics(code)
  const builtin = basicDictionary(code, (text) => parseWith(code, text))

  const dictionaries = builtin ? [builtin] : []
  const archive = basicEntries(basics.words)

  return {
    dictionaries,
    wordPool: poolFromDictionaries(dictionaries, archive),
    archive,
    phrasePool: {},
    phraseArchive: basicEntries(basics.phrases),
    // id словаря -> доля прочитанного (0..1), для режима чтения
    reading: {},
    // кэш переводов предложений: хэш предложения -> { ru, at }
    sentences: {},
  }
}

function emptyByLanguage() {
  return Object.fromEntries(Object.keys(LANGUAGES).map((code) => [code, emptyLanguageState(code)]))
}

export const useWordsStore = defineStore('main', {
  state: () => ({
    language: DEFAULT_LANGUAGE,
    maxLevel: 5,
    // размер шрифта читалки, общий для всех языков
    fontSize: 18,
    // текущий режим изучения: слова или фразы
    learnMode: WORD,
    byLanguage: emptyByLanguage(),
  }),
  getters: {
    getMaxLevel: (state) => state.maxLevel,
    getFontSize: (state) => state.fontSize,
    getLearnMode: (state) => state.learnMode,
    getLanguageCode: (state) => state.language,
    getLanguageConfig: (state) => getLanguage(state.language),

    /** данные текущего языка */
    current: (state) => state.byLanguage[state.language] ?? emptyLanguageState(),

    /** пул и архив нужного режима; без аргумента — текущего */
    poolOf() {
      return (kind = this.learnMode) => (kind === PHRASE ? this.current.phrasePool : this.current.wordPool)
    },
    archiveOf() {
      return (kind = this.learnMode) => (kind === PHRASE ? this.current.phraseArchive : this.current.archive)
    },

    getDicts() {
      return this.current.dictionaries
    },
    getWordPool() {
      return this.current.wordPool
    },
    getPhrasePool() {
      return this.current.phrasePool
    },
    getArchive() {
      return this.current.archive
    },
    getPhraseArchive() {
      return this.current.phraseArchive
    },
    getReading() {
      return this.current.reading
    },
    getWordPoolSize() {
      return Object.keys(this.current.wordPool).length
    },
    /** размер пула текущего режима */
    getPoolSize() {
      return Object.keys(this.poolOf()).length
    },
    getInterval() {
      return (level, kind) => subset(this.poolOf(kind), (k, v) => v.level === level)
    },
    getForLearn() {
      return (count, kind) =>
        getMaxByField(
          subset(this.poolOf(kind), (k, v) => v.level === 0),
          'frequency',
          count,
        )
    },
    getForLesson() {
      // без перевода спрашивать нечего: такая карточка сломала бы урок
      return subset(this.poolOf(), (k, v) => v.countdown === 0 && v.level > 0 && v.ru)
    },
    getDictById() {
      return (id) => this.current.dictionaries.find((dict) => dict.id === id) ?? null
    },
    /**
     * Статус для подсветки в режиме чтения:
     * known — выучено, learn — изучается, queue — в очереди, unknown — не из словарей
     */
    getStatus() {
      return (key, kind) => {
        if (this.archiveOf(kind)[key]) {
          return 'known'
        }
        const entry = this.poolOf(kind)[key]
        if (!entry) {
          return 'unknown'
        }
        return entry.level > 0 ? 'learn' : 'queue'
      }
    },
    /**
     * Перевод из очереди или из словарного запаса.
     * У базовой лексики и выученного записи в очереди нет — только в архиве.
     */
    getTranslation() {
      return (key, kind) => this.poolOf(kind)[key]?.ru ?? this.archiveOf(kind)[key]?.ru ?? null
    },
    /** перевод предложения из кэша; null — предложение ещё не переводили */
    getSentenceTranslation() {
      return (text) => this.current.sentences?.[sentenceKey(text)]?.ru ?? null
    },
    getWordStatus() {
      return (word) => this.getStatus(word, WORD)
    },
    getPhraseStatus() {
      return (phrase) => this.getStatus(phrase, PHRASE)
    },
  },
  actions: {
    /** гарантирует, что для языка есть своя ячейка (например, после добавления нового языка) */
    ensureLanguage(code) {
      if (!this.byLanguage[code]) {
        this.byLanguage[code] = emptyLanguageState(code)
      }
      return this.byLanguage[code]
    },

    /**
     * Обнуляет обучение, оставляя тексты и фразы.
     *
     * Пул слов пересобирается из словарей, а не просто чистится: выученные
     * слова лежат в архиве и в пуле их уже нет, так что после очистки архива
     * они бы исчезли совсем. Переводы переносим — их добывали не зря.
     */
    resetProgress() {
      Object.entries(this.byLanguage).forEach(([code, slice]) => {
        // слово может быть сразу и в пуле, и в архиве: append() возвращает
        // выученное слово в пул, когда оно встретилось в новом тексте.
        // Поэтому берём не «запись целиком», а первый непустой перевод
        const translationOf = (key, pool, archive) => pool[key]?.ru ?? archive[key]?.ru ?? null

        const basics = getBasics(code)
        // базовая лексика встроена в приложение, сбросом её не убрать
        const archive = basicEntries(basics.words)
        const phraseArchive = basicEntries(basics.phrases)

        const previous = Object.fromEntries(
          Object.keys({ ...slice.wordPool, ...slice.archive }).map((word) => [
            word,
            { ru: translationOf(word, slice.wordPool, slice.archive) },
          ]),
        )

        const phraseKeys = new Set([...Object.keys(slice.phrasePool), ...Object.keys(slice.phraseArchive)])
        const phrases = {}
        phraseKeys.forEach((key) => {
          if (phraseArchive[key]) {
            return
          }
          phrases[key] = {
            frequency: slice.phrasePool[key]?.frequency ?? slice.phraseArchive[key]?.frequency ?? 1,
            ru: translationOf(key, slice.phrasePool, slice.phraseArchive),
            level: 0,
          }
        })

        slice.wordPool = poolFromDictionaries(slice.dictionaries, archive, previous)
        slice.archive = archive
        slice.phrasePool = phrases
        slice.phraseArchive = phraseArchive
      })
    },

    setFontSize(size) {
      this.fontSize = Math.min(Math.max(size, MIN_FONT_SIZE), MAX_FONT_SIZE)
    },

    setLanguage(code) {
      if (!LANGUAGES[code]) {
        return
      }
      this.ensureLanguage(code)
      this.language = code
    },

    setLearnMode(mode) {
      if (mode === WORD || mode === PHRASE) {
        this.learnMode = mode
      }
    },

    /**
     * create Dictionary from text
     */
    parse(text) {
      return parseWith(this.language, text)
    },

    append(dict) {
      const slice = this.ensureLanguage(this.language)

      slice.dictionaries.push({
        ...dict,
        id: dict.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: dict.createdAt ?? new Date().toISOString(),
      })

      // tmp for performance
      let tmp = JSON.parse(JSON.stringify(slice.wordPool))

      Object.keys(dict.frequency).forEach((word) => {
        // уже известное слово (базовая лексика или выученное) в очередь не возвращаем
        if (slice.archive[word]) {
          return
        }
        tmp[word] = {
          frequency: (slice.wordPool[word]?.frequency ?? 0) + dict.frequency[word],
          ru: slice.wordPool[word]?.ru ?? null,
          level: slice.wordPool[word]?.level ?? 0,
        }
      })
      slice.wordPool = tmp
    },

    /**
     * Добавить фразу в пул. В отличие от слов, фразы не появляются сами при
     * разборе текста — их выделяют вручную в читалке.
     */
    addPhrase(phrase, frequency = 1) {
      const slice = this.ensureLanguage(this.language)
      const existing = slice.phrasePool[phrase]

      slice.phrasePool[phrase] = {
        frequency: existing?.frequency ?? frequency,
        ru: existing?.ru ?? null,
        level: existing?.level ?? 0,
      }
    },

    removePhrase(phrase) {
      const slice = this.ensureLanguage(this.language)
      delete slice.phrasePool[phrase]
    },

    toLearn(items, kind) {
      const slice = this.ensureLanguage(this.language)
      const target = (kind ?? this.learnMode) === PHRASE ? 'phrasePool' : 'wordPool'

      const known = (kind ?? this.learnMode) === PHRASE ? slice.phraseArchive : slice.archive

      let all = JSON.parse(JSON.stringify(slice[target]))
      Object.entries(items).forEach(([key, ru]) => {
        const translation = typeof ru === 'string' ? ru.trim() : ''

        // без перевода на изучение не берём — оно останется в очереди;
        // уже известное учить заново тоже незачем
        if (!all[key] || !translation || known[key]) {
          return
        }
        all[key].level = 1
        all[key].countdown = 1
        all[key].ru = translation
      })

      slice[target] = all
    },

    /** сохранить перевод, не переводя запись на изучение */
    setTranslation(key, ru, kind) {
      const slice = this.ensureLanguage(this.language)
      const target = (kind ?? this.learnMode) === PHRASE ? 'phrasePool' : 'wordPool'

      if (slice[target][key]) {
        slice[target][key].ru = ru
      }
    },

    /**
     * Запомнить перевод предложения.
     *
     * Предложение переводится секундами, а страницу перечитывают: без кэша
     * каждый повторный клик снова ждал бы модель. В отличие от слов и фраз,
     * предложение не изучают — его негде хранить, кроме отдельного кэша.
     */
    cacheSentence(text, ru) {
      const slice = this.ensureLanguage(this.language)
      const entries = Object.entries(slice.sentences)

      // два предложения в одну миллисекунду — обычное дело при перелистывании,
      // поэтому номер не просто время, а строго больше предыдущего: иначе
      // вытеснять пришлось бы наугад
      const last = entries.reduce((max, [, entry]) => Math.max(max, entry.at ?? 0), 0)

      slice.sentences[sentenceKey(text)] = { ru, at: Math.max(Date.now(), last + 1) }

      // Переполнился — выкидываем самые давние переводы: до них дочитали
      // раньше, значит и вернутся к ним с меньшей вероятностью. Чистим с
      // запасом, чтобы не сортировать кэш на каждом следующем предложении.
      if (entries.length + 1 > SENTENCE_CACHE_LIMIT) {
        const keep = Math.round(SENTENCE_CACHE_LIMIT * 0.9)

        Object.keys(slice.sentences)
          .sort((a, b) => slice.sentences[a].at - slice.sentences[b].at)
          .slice(0, Object.keys(slice.sentences).length - keep)
          .forEach((key) => delete slice.sentences[key])
      }
    },

    /** запомнить позицию чтения (0..1) */
    setReadingProgress(dictId, progress) {
      const slice = this.ensureLanguage(this.language)
      slice.reading[dictId] = progress
    },

    /**
     * Перевод локальной моделью. Возвращает массив той же длины, что и items:
     * элемент null означает, что конкретно это слово перевести не удалось.
     */
    async translate(items, { signal, timeout, onProgress } = {}) {
      const { promptFrom, promptTo } = getLanguage(this.language)

      return translateAll(items, { from: promptFrom, to: promptTo, signal, timeout, onProgress })
    },

    /** день проходит сразу для слов и для фраз */
    step() {
      const slice = this.ensureLanguage(this.language)

      ;['wordPool', 'phrasePool'].forEach((target) => {
        let tmp = JSON.parse(JSON.stringify(slice[target]))

        Object.keys(tmp).forEach((key) => {
          if (tmp[key].countdown > 0) {
            tmp[key].countdown--
          }
        })
        slice[target] = tmp
      })
    },

    saveLesson(items, kind) {
      const slice = this.ensureLanguage(this.language)
      const phrases = (kind ?? this.learnMode) === PHRASE
      const target = phrases ? 'phrasePool' : 'wordPool'
      const store = phrases ? 'phraseArchive' : 'archive'

      let tmp = JSON.parse(JSON.stringify(slice[target]))

      Object.entries(items).forEach(([key, result]) => {
        if (!tmp[key]) {
          return
        }

        if (!result) {
          if (tmp[key].level > 1) {
            tmp[key].level = 1
            tmp[key].countdown = tmp[key].level
          }
          return
        }

        if (tmp[key].level === this.maxLevel) {
          slice[store][key] = tmp[key]
          delete tmp[key]
          return
        }

        tmp[key].level++
        tmp[key].countdown = tmp[key].level
      })

      slice[target] = tmp
    },
  },
  persist: {
    /**
     * Данные из версии до появления мультиязычности лежали плоско
     * (dictionaries / wordPool / archive) — переносим их в английскую ячейку.
     */
    afterHydrate(ctx) {
      const state = ctx.store.$state

      if (Array.isArray(state.dictionaries) || state.wordPool) {
        const legacy = state.byLanguage[DEFAULT_LANGUAGE] ?? emptyLanguageState()
        legacy.dictionaries = state.dictionaries ?? legacy.dictionaries
        legacy.wordPool = state.wordPool ?? legacy.wordPool
        legacy.archive = state.archive ?? legacy.archive
        state.byLanguage[DEFAULT_LANGUAGE] = legacy

        delete state.dictionaries
        delete state.wordPool
        delete state.archive
      }

      // старые словари сохранялись без id — проставляем, иначе не открыть в читалке
      Object.entries(state.byLanguage ?? {}).forEach(([code, slice]) => {
        if (!slice.reading) {
          slice.reading = {}
        }
        // кэш переводов предложений появился позже
        if (!slice.sentences) {
          slice.sentences = {}
        }
        // пулы фраз появились позже — у ранних сохранений их нет
        if (!slice.phrasePool) {
          slice.phrasePool = {}
        }
        if (!slice.phraseArchive) {
          slice.phraseArchive = {}
        }

        // Раньше слово можно было отправить на изучение с пустым переводом:
        // в уроке оно превращалось в вариант без текста, который совпадал
        // с «ничего не выбрано» и выглядел выбранным заранее.
        // Возвращаем такие записи в очередь — там их можно перевести.
        ;['wordPool', 'phrasePool'].forEach((target) => {
          Object.values(slice[target] ?? {}).forEach((entry) => {
            if (entry.level > 0 && !entry.ru) {
              entry.level = 0
              delete entry.countdown
            }
          })
        })
        ;(slice.dictionaries ?? []).forEach((dict, i) => {
          if (!dict.id) {
            dict.id = `legacy-${i}`
          }
        })

        // Базовая лексика и встроенный текст добавились позже и могут
        // пополняться в новых версиях — доливаем недостающее при каждом старте.
        const basics = getBasics(code)

        Object.entries(basicEntries(basics.words)).forEach(([key, entry]) => {
          slice.archive[key] = slice.archive[key] ?? entry
        })
        Object.entries(basicEntries(basics.phrases)).forEach(([key, entry]) => {
          slice.phraseArchive[key] = slice.phraseArchive[key] ?? entry
        })

        if (basics.text && !slice.dictionaries.some((dict) => dict.id === BUILTIN_DICT_ID)) {
          slice.dictionaries.unshift(basicDictionary(code, (text) => parseWith(code, text)))
        }

        // известное слово не должно одновременно висеть в очереди
        Object.keys(slice.archive).forEach((word) => delete slice.wordPool[word])
        Object.keys(slice.phraseArchive).forEach((key) => delete slice.phrasePool[key])
      })
    },
  },
})
