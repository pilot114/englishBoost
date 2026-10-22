/**
 * Базовая лексика, которую приложение считает известной с самого начала.
 *
 * Смысл: сотня самых частотных слов покрывает около половины любого английского
 * текста. Если гонять их через интервальные повторения наравне с остальными, вся
 * очередь забьётся артиклями и предлогами. Поэтому они сразу лежат в словарном
 * запасе: подсвечиваются в читалке как выученные и не попадают в обучение.
 *
 * Порядок слов — по убыванию частотности.
 */
const EN_WORDS = {
  the: 'определённый артикль',
  be: 'быть',
  to: 'к, в; частица инфинитива',
  of: 'предлог родительного падежа',
  and: 'и',
  a: 'неопределённый артикль',
  in: 'в',
  that: 'что; тот',
  have: 'иметь',
  i: 'я',
  it: 'оно, это',
  for: 'для',
  not: 'не',
  on: 'на',
  with: 'с',
  he: 'он',
  as: 'как; в качестве',
  you: 'ты, вы',
  do: 'делать',
  at: 'у, в, на',
  this: 'этот',
  but: 'но',
  his: 'его',
  by: 'посредством; у',
  from: 'от, из',
  they: 'они',
  we: 'мы',
  say: 'говорить',
  her: 'её, ей',
  she: 'она',
  or: 'или',
  an: 'неопределённый артикль',
  will: 'будет; воля',
  my: 'мой',
  one: 'один',
  all: 'все, всё',
  would: 'бы',
  there: 'там',
  their: 'их',
  what: 'что',
  so: 'так, поэтому',
  up: 'вверх',
  out: 'наружу',
  if: 'если',
  about: 'о, около',
  who: 'кто',
  get: 'получать',
  which: 'который',
  go: 'идти',
  me: 'мне, меня',
  when: 'когда',
  make: 'делать',
  can: 'мочь',
  like: 'нравиться; как',
  time: 'время',
  no: 'нет',
  just: 'просто; только что',
  him: 'его, ему',
  know: 'знать',
  take: 'брать',
  people: 'люди',
  into: 'в, внутрь',
  year: 'год',
  your: 'твой, ваш',
  good: 'хороший',
  some: 'некоторые',
  could: 'мог бы',
  them: 'их, им',
  see: 'видеть',
  other: 'другой',
  than: 'чем',
  then: 'тогда, затем',
  now: 'сейчас',
  look: 'смотреть',
  only: 'только',
  come: 'приходить',
  its: 'его, её (о предмете)',
  over: 'над; через',
  think: 'думать',
  also: 'также',
  back: 'назад; спина',
  after: 'после',
  use: 'использовать',
  two: 'два',
  how: 'как',
  our: 'наш',
  work: 'работать; работа',
  first: 'первый',
  well: 'хорошо',
  way: 'путь, способ',
  even: 'даже',
  new: 'новый',
  want: 'хотеть',
  because: 'потому что',
  any: 'любой',
  these: 'эти',
  give: 'давать',
  day: 'день',
  most: 'большинство; наиболее',
  us: 'нам, нас',
}

/**
 * Устойчивые выражения. Ключ — в том же виде, что и у фраз, добавленных вручную:
 * слова в нижнем регистре через один пробел.
 */
const EN_PHRASES = {
  'of course': 'конечно',
  'at least': 'по крайней мере',
  'as well': 'тоже, также',
  'in fact': 'на самом деле',
  'no matter': 'неважно; несмотря на',
  'make sense': 'иметь смысл',
  'take care': 'заботиться; береги себя',
  'give up': 'сдаться',
  'look forward to': 'с нетерпением ждать',
  'by the way': 'кстати',
  'as soon as': 'как только',
  'in order to': 'для того чтобы',
  'so far': 'пока что, до сих пор',
  'right away': 'сразу же',
  'keep in mind': 'иметь в виду',
  'on purpose': 'нарочно, специально',
  'once in a while': 'время от времени',
  'get rid of': 'избавиться от',
  'run out of': 'закончиться (о запасе)',
  'take place': 'происходить',
}

/**
 * Встроенный текст, в котором встречаются все базовые слова и все выражения выше.
 * Он всегда есть в списке текстов и переживает любой сброс: это опора, на которой
 * видно, как знакомая лексика выглядит в связной речи.
 */
const EN_TEXT = `An Hour a Day

Of course, a new language can look like more work than you want. In fact, most people give up on it in the first year, and they say it is because they have no time.

Here is what I would do. I take one good book and make it my only work for an hour a day. By the way, that hour can be at any time of day — some people say the first hour after they get up is the best, and I think they are right.

Keep in mind: no matter what other people think, your way is your way. If it does make sense to you, then use it. At least two things will help us all.

One: see the same words come back over and over, so that they do not run out of your head. Two: give them a place in what you say. Words we do not use just go out of our minds.

So far, so good. As soon as you know some of these words, look forward to the day when you can say more than two or three of them.

There was a year when I could not get any new words into my head. I would take up a book and, once in a while, I would put it down. Then I did it on purpose: I went back to the words which I had not used, and I did not get rid of them.

My first teacher was a good one. Her way was simple, and its first line was this: be with the language every day. She would look at me and say that other people and their books will not do the work for us.

He who comes after you will want the same things you want now, and what helps you will also help him. His way may not be your way, but that is good as well. What takes place in one head does not take place in the next.

Do not think too much about how long it will take. Even one good hour a day will do more than all the other things you could think of.

Take care of these words now and they will take care of you. Right away, from this day: know what you want, do the work in order to get it, and let time do the rest.`

/**
 * По языкам. У сербского базового списка пока нет — механика от этого не ломается,
 * просто словарный запас начинается пустым.
 */
export const BASICS = {
  en: { words: EN_WORDS, phrases: EN_PHRASES, text: EN_TEXT },
  sr: { words: {}, phrases: {}, text: null },
}

export function getBasics(code) {
  return BASICS[code] ?? { words: {}, phrases: {} }
}

/** уровень, с которым базовая лексика лежит в словарном запасе */
export const BASIC_LEVEL = 5

/** id встроенного текста: по нему его узнают и не дают удалить */
export const BUILTIN_DICT_ID = 'builtin-basics'

/** встроенный текст как обычный словарь, но с пометкой builtin */
export function basicDictionary(code, parse) {
  const { text } = getBasics(code)
  if (!text) {
    return null
  }

  return {
    ...parse(text),
    id: BUILTIN_DICT_ID,
    builtin: true,
    name: 'Базовая лексика',
    description: 'Все встроенные слова и выражения в связном тексте',
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

/**
 * Превращает «слово -> перевод» в записи словарного запаса.
 * frequency 0 — эти слова не приходили из текстов пользователя.
 */
export function basicEntries(dictionary) {
  return Object.fromEntries(
    Object.entries(dictionary).map(([key, ru]) => [
      key,
      {
        frequency: 0,
        ru,
        level: BASIC_LEVEL,
        basic: true,
      },
    ]),
  )
}
