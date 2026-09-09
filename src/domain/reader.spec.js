import { expect, describe, it } from 'vitest'
import {
    buildPhraseIndex,
    countSequence,
    markPhrases,
    phraseFromSelection,
    phraseKey,
    sentenceKey,
    sentencePhrases,
    splitSentences,
    paginate,
    splitParagraphs,
    tokenize,
} from './reader'
import { getLanguage } from './languages'

const EN = getLanguage('en').wordPattern

describe('splitParagraphs', () => {
    it('выкидывает пустые строки и чистит края', () => {
        expect(splitParagraphs('  первый \n\n\n  второй  \n')).toEqual(['первый', 'второй'])
    })

    it('переживает пустой текст', () => {
        expect(splitParagraphs('')).toEqual([])
        expect(splitParagraphs(null)).toEqual([])
    })
})

describe('paginate', () => {
    it('собирает короткие абзацы на одну страницу', () => {
        const pages = paginate('раз\nдва\nтри', 100)

        expect(pages.length).toBe(1)
        expect(pages[0]).toEqual(['раз', 'два', 'три'])
    })

    it('переносит абзац на новую страницу, когда текущая заполнена', () => {
        const pages = paginate('aaaa\nbbbb\ncccc', 8)

        expect(pages).toEqual([['aaaa', 'bbbb'], ['cccc']])
    })

    it('режет слишком длинный абзац по границам слов', () => {
        const pages = paginate('alpha beta gamma delta', 12)

        pages.flat().forEach(chunk => expect(chunk.length).toBeLessThanOrEqual(12))
        expect(pages.flat().join(' ')).toBe('alpha beta gamma delta')
    })

    it('на пустом тексте отдаёт одну пустую страницу', () => {
        expect(paginate('')).toEqual([[]])
    })

    it('сохраняет весь текст без потерь', () => {
        const text = Array.from({ length: 50 }, (_, i) => `абзац номер ${i} со словами`).join('\n')
        const restored = paginate(text, 60).flat().join('\n')

        expect(restored).toBe(text)
    })
})

describe('tokenize', () => {
    it('разделяет слова и разделители, сохраняя исходный текст', () => {
        const tokens = tokenize('Hello, world!', getLanguage('en').wordPattern)

        expect(tokens.map(t => t.text).join('')).toBe('Hello, world!')
        expect(tokens.filter(t => t.word).map(t => t.word)).toEqual(['hello', 'world'])
    })

    it('для сербского берёт и латиницу, и кириллицу', () => {
        const pattern = getLanguage('sr').wordPattern

        expect(tokenize('Mačka voli ribu.', pattern).filter(t => t.word).map(t => t.word))
            .toEqual(['mačka', 'voli', 'ribu'])
        expect(tokenize('Мачка воли рибу.', pattern).filter(t => t.word).map(t => t.word))
            .toEqual(['мачка', 'воли', 'рибу'])
    })

    it('не теряет совпадения при повторных вызовах', () => {
        const pattern = getLanguage('en').wordPattern

        // один и тот же regexp с флагом g — частая причина пропуска слов
        const first = tokenize('one two', pattern).filter(t => t.word).length
        const second = tokenize('one two', pattern).filter(t => t.word).length

        expect(first).toBe(2)
        expect(second).toBe(2)
    })
})



describe('markPhrases', () => {
    it('отмечает токены, входящие во фразу', () => {
        const tokens = markPhrases(
            tokenize('I give up now.', EN),
            buildPhraseIndex(['give up'])
        )

        expect(tokens.filter(t => t.phrase).map(t => t.text)).toEqual(['give', 'up'])
        expect(tokens.find(t => t.word === 'now').phrase).toBeUndefined()
    })

    it('при пересечении выигрывает более длинная фраза', () => {
        const tokens = markPhrases(
            tokenize('give up on it', EN),
            buildPhraseIndex(['give up', 'give up on'])
        )

        expect(tokens.filter(t => t.phrase).map(t => t.text)).toEqual(['give', 'up', 'on'])
        expect(new Set(tokens.filter(t => t.phrase).map(t => t.phrase))).toEqual(new Set(['give up on']))
    })

    it('находит все вхождения фразы в абзаце', () => {
        const tokens = markPhrases(
            tokenize('give up, then give up again', EN),
            buildPhraseIndex(['give up'])
        )

        expect(tokens.filter(t => t.phrase).length).toBe(4)
    })

    it('пустой индекс ничего не меняет', () => {
        const tokens = markPhrases(tokenize('give up', EN), buildPhraseIndex([]))
        expect(tokens.some(t => t.phrase)).toBe(false)
    })

    it('не отмечает частичное совпадение', () => {
        const tokens = markPhrases(
            tokenize('give it up', EN),
            buildPhraseIndex(['give up'])
        )
        expect(tokens.some(t => t.phrase)).toBe(false)
    })
})

describe('tokenize: индексы слов', () => {
    it('нумерует слова по порядку в абзаце', () => {
        const tokens = tokenize('one, two three', EN)
        expect(tokens.filter(t => t.word).map(t => t.wi)).toEqual([0, 1, 2])
    })
})

describe('splitSentences', () => {
    const split = text => splitSentences(tokenize(text, EN)).map(s => s.text)

    it('режет абзац по точкам', () => {
        expect(split('She left. He stayed. They waited.'))
            .toEqual(['She left.', 'He stayed.', 'They waited.'])
    })

    it('понимает вопрос и восклицание', () => {
        expect(split('Who is there? Nobody! Really.'))
            .toEqual(['Who is there?', 'Nobody!', 'Really.'])
    })

    it('абзац без точки — одно предложение', () => {
        expect(split('Chapter one')).toEqual(['Chapter one'])
    })

    it('не плодит пустые предложения на хвостовой точке', () => {
        expect(split('Done.')).toEqual(['Done.'])
    })

    it('нумерует предложения подряд', () => {
        const sentences = splitSentences(tokenize('One. Two. Three.', EN))
        expect(sentences.map(s => s.index)).toEqual([0, 1, 2])
    })

    it('проставляет si каждому токену', () => {
        const tokens = tokenize('One. Two.', EN)
        splitSentences(tokens)

        expect(tokens.find(t => t.word === 'one').si).toBe(0)
        expect(tokens.find(t => t.word === 'two').si).toBe(1)
    })

    it('текст предложений собирается без потерь', () => {
        const text = 'She did not give up. He did.'
        expect(split(text).join(' ')).toBe(text)
    })
})

describe('sentencePhrases', () => {
    it('отдаёт фразы словаря, встреченные в предложении', () => {
        const tokens = markPhrases(
            tokenize('She did give up on it. He left.', EN),
            buildPhraseIndex(['give up on'])
        )
        const [first, second] = splitSentences(tokens)

        expect(sentencePhrases(first)).toEqual(['give up on'])
        expect(sentencePhrases(second)).toEqual([])
    })

    it('повторную фразу не дублирует', () => {
        const tokens = markPhrases(
            tokenize('give up on and give up on again.', EN),
            buildPhraseIndex(['give up on'])
        )

        expect(sentencePhrases(splitSentences(tokens)[0])).toEqual(['give up on'])
    })
})

describe('phraseKey', () => {
    it('склеивает слова в нижнем регистре через пробел', () => {
        expect(phraseKey(['Give', 'UP'])).toBe('give up')
    })
})

describe('sentenceKey', () => {
    const sentence = 'The rabbit was late again.'

    it('одно предложение — один ключ', () => {
        expect(sentenceKey(sentence)).toBe(sentenceKey(sentence))
    })

    it('ключ короткий независимо от длины предложения', () => {
        const long = 'Alice was beginning to get very tired of sitting by her sister on the bank, '
            + 'and of having nothing to do: once or twice she had peeped into the book her sister was reading.'

        expect(sentenceKey(long).length).toBeLessThan(15)
    })

    it('разные предложения — разные ключи', () => {
        expect(sentenceKey('The rabbit was late.')).not.toBe(sentenceKey('The rabbit was here.'))
    })

    it('перенос строки внутри предложения ключ не меняет', () => {
        // одно и то же предложение на разных страницах разбивается по-разному
        expect(sentenceKey('The rabbit\n  was late again.')).toBe(sentenceKey(sentence))
    })

    it('регистр и знаки важны: это разные предложения', () => {
        expect(sentenceKey('Run!')).not.toBe(sentenceKey('run!'))
        expect(sentenceKey('Run!')).not.toBe(sentenceKey('Run?'))
    })

    it('переживает пустой ввод', () => {
        expect(sentenceKey('')).toBe(sentenceKey(null))
    })

    it('не выдаёт один ключ на разные предложения книги', () => {
        // на 32-битном хэше коллизия здесь была бы делом времени
        const sentences = Array.from({ length: 5000 }, (_, i) => `The rabbit was late ${i} times.`)
        const keys = new Set(sentences.map(sentenceKey))

        expect(keys.size).toBe(sentences.length)
    })
})

describe('phraseFromSelection', () => {
    it('чистит выделение до ключа фразы', () => {
        expect(phraseFromSelection('Give up on', EN)).toBe('give up on')
    })

    it('отбрасывает знаки препинания и лишние пробелы по краям', () => {
        expect(phraseFromSelection('  give up on, ', EN)).toBe('give up on')
    })

    it('выделение внутри слов не ломает ключ', () => {
        expect(phraseFromSelection('ive up o', EN)).toBe('ive up o')
    })

    it('одно слово остаётся одним словом — вызывающий код это отличит', () => {
        expect(phraseFromSelection('rabbit', EN)).toBe('rabbit')
        expect(phraseFromSelection('rabbit', EN).includes(' ')).toBe(false)
    })

    it('пустое выделение даёт пустой ключ', () => {
        expect(phraseFromSelection('   ', EN)).toBe('')
        expect(phraseFromSelection(null, EN)).toBe('')
    })

    it('переносы строк схлопываются в пробел', () => {
        expect(phraseFromSelection('give\nup', EN)).toBe('give up')
    })
})

describe('countSequence', () => {
    const words = ['i', 'give', 'up', 'and', 'you', 'give', 'up', 'too']

    it('считает вхождения последовательности', () => {
        expect(countSequence(words, ['give', 'up'])).toBe(2)
    })

    it('отсутствующая последовательность даёт ноль', () => {
        expect(countSequence(words, ['give', 'in'])).toBe(0)
    })

    it('последовательность длиннее текста даёт ноль', () => {
        expect(countSequence(['give'], ['give', 'up'])).toBe(0)
    })

    it('пустая последовательность даёт ноль', () => {
        expect(countSequence(words, [])).toBe(0)
    })
})
