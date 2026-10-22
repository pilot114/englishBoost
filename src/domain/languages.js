/**
 * Поддерживаемые языки изучения.
 *
 * code        — ключ, под которым хранятся словари/слова в сторе
 * name        — подпись в интерфейсе
 * flag        — эмодзи-флаг для переключателя
 * promptFrom  — как язык называется в промпте переводчика
 * promptTo    — язык интерфейса пользователя, на него переводим
 * letterClass — содержимое символьного класса регекспа: что считается буквой
 *
 * Из letterClass собираются два регекспа:
 * letters     — всё, что НЕ буква (для нормализации слова)
 * wordPattern — цепочки букв (для разбора текста на слова в читалке)
 *
 * Оба отдаются геттерами, т.е. каждый раз это свежий объект: регекспы с флагом g
 * хранят lastIndex, и переиспользование одного экземпляра между вызовами
 * matchAll/exec приводит к пропуску совпадений.
 */
function language({ code, name, flag, promptFrom, promptTo, letterClass, unicode = false }) {
  const flags = unicode ? 'u' : ''
  return {
    code,
    name,
    flag,
    promptFrom,
    promptTo,
    get letters() {
      return new RegExp(`[^${letterClass}]`, `g${flags}`)
    },
    get wordPattern() {
      return new RegExp(`[${letterClass}]+`, `g${flags}`)
    },
  }
}

export const LANGUAGES = {
  en: language({
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    promptFrom: 'English',
    promptTo: 'Russian',
    // только базовая латиница
    letterClass: 'a-zA-Z',
  }),
  sr: language({
    code: 'sr',
    name: 'Srpski',
    flag: '🇷🇸',
    promptFrom: 'Serbian',
    promptTo: 'Russian',
    // сербский двухалфавитный: и gaj-латиница (čćđšž), и кириллица (ћђжшч)
    letterClass: '\\p{Script=Latin}\\p{Script=Cyrillic}',
    unicode: true,
  }),
}

export const DEFAULT_LANGUAGE = 'en'

export const languageList = Object.values(LANGUAGES)

export function getLanguage(code) {
  return LANGUAGES[code] ?? LANGUAGES[DEFAULT_LANGUAGE]
}
