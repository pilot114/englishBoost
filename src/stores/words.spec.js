import { expect, describe, it, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { SENTENCE_CACHE_LIMIT, useWordsStore } from './words'
import { BASICS, BUILTIN_DICT_ID } from '@/domain/basics'

let store = null

// приложение стартует не с пустого места: базовая лексика лежит в словарном
// запасе, а встроенный текст — в списке текстов. Поэтому проверяем прирост,
// а не абсолютные числа
let base = null
const BASIC_WORDS = BASICS.en.words
const BASIC_PHRASES = BASICS.en.phrases

/** уникальные слова текстов, которых ещё нет в базовой лексике */
function learnable(texts) {
    const words = new Set(texts.flatMap(text => store.parse(text).words))
    return [...words].filter(word => !(word in BASIC_WORDS))
}
const provider = [
    {
        text: "The let keyword declares a BLock-scoped variable, which means that the variable " +
            "is only accessible within The block of code in which it was declared, whereas the var keyword",
        name: "test Dictionary",
        wordCount: 29,
        theCount: 4,
        keywordCount: 2,
    },
    {
        text: "When writing tests it's only a matter of time the before you need to create a fake version of an internal — or" +
            "external — service. This is commonly referred to as mocking. Vitest provides utility functions to help you out" +
            "through its vi helper. You can import { vi } from 'vitest' or access it globally (when global configuration is enabled)",
        name: "vitest Mocking",
        wordCount: 56,
        theCount: 1,
        keywordCount: undefined,
    },
]
// намеренно не базовые слова: базовые уже выучены и на изучение не берутся
let translated = { block: 'блок', keyword: 'ключевое слово', variable: 'переменная', mocking: 'мокирование', helper: 'помощник' }


describe('Words Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        store = useWordsStore()
        base = {
            pool: store.getWordPoolSize,
            dicts: store.getDicts.length,
            archive: Object.keys(store.getArchive).length,
        }
    })

    it.each(provider)('parse', (data) => {
        let dict = store.parse(data.text, data.name)

        expect(dict.text).toBe(data.text)

        expect(dict.words.length).toBe(data.wordCount)
        expect(dict.frequency.the).toBe(data.theCount)
        expect(dict.frequency.keyword).toBe(data.keywordCount)
    })

    it('append', () => {
        const before = new Set(Object.keys(store.getWordPool))
        provider.forEach(data => store.append(store.parse(data.text, data.name)))

        const added = learnable(provider.map(d => d.text)).filter(word => !before.has(word))

        expect(store.getWordPoolSize).toBe(base.pool + added.length)
        expect(store.getDicts.length).toBe(base.dicts + 2)
    })

    it('базовая лексика не попадает в очередь', () => {
        provider.forEach(data => store.append(store.parse(data.text, data.name)))

        // «the» есть в обоих текстах и входит в базовую сотню
        expect(store.getWordPool.the).toBeUndefined()
        expect(store.getArchive.the).toBeTruthy()
        expect(store.getWordStatus('the')).toBe('known')
    })

    it('встроенный текст на месте и помечен', () => {
        const builtin = store.getDictById(BUILTIN_DICT_ID)

        expect(builtin).toBeTruthy()
        expect(builtin.builtin).toBe(true)
        expect(builtin.text.length).toBeGreaterThan(500)
    })

    it('во встроенном тексте есть вся базовая лексика', () => {
        const text = store.getDictById(BUILTIN_DICT_ID)
        const present = new Set(text.words)
        const flat = text.words.join(' ')

        expect(Object.keys(BASIC_WORDS).filter(word => !present.has(word))).toEqual([])
        expect(Object.keys(BASIC_PHRASES).filter(phrase => !flat.includes(phrase))).toEqual([])
    })

    it('базовых слов ровно сто, выражений двадцать', () => {
        expect(Object.keys(BASIC_WORDS).length).toBe(100)
        expect(Object.keys(BASIC_PHRASES).length).toBe(20)
    })

    it('базовые выражения лежат в словарном запасе фраз', () => {
        expect(store.getPhraseStatus('of course')).toBe('known')
        expect(store.getPhraseArchive['of course'].ru).toBe('конечно')
    })

    it('toLearn', () => {
        provider.forEach(data => store.append(store.parse(data.text, data.name)))

        store.toLearn(translated)
        expect(Object.keys(store.getInterval(1)).length).toBe(5)
    })

    it('базовое слово на изучение не берётся', () => {
        provider.forEach(data => store.append(store.parse(data.text, data.name)))

        store.toLearn({ the: 'артикль' })
        expect(Object.keys(store.getInterval(1)).length).toBe(0)
        expect(store.getArchive.the.basic).toBe(true)
    })

    // it('translate', async () => {
    it.skip('translate', async () => {
        provider.forEach(data => store.append(store.parse(data.text, data.name)))

        const words = Object.keys(store.getInterval(0))
        const result = await store.translate(words)

        expect(result.length).toBe(words.length)
    })

    it('step', () => {
        provider.forEach(data => store.append(store.parse(data.text, data.name)))
        store.toLearn(translated)

        store.step()
        expect(Object.keys(store.getForLesson).length).toBe(5)
    })

    it('parse сербского принимает латиницу и кириллицу', () => {
        store.setLanguage('sr')

        const latin = store.parse('Mačka voli ribu')
        expect(latin.words).toEqual(['mačka', 'voli', 'ribu'])

        const cyrillic = store.parse('Мачка воли рибу')
        expect(cyrillic.words).toEqual(['мачка', 'воли', 'рибу'])
    })

    it('parse английского отбрасывает нелатинские символы', () => {
        const dict = store.parse('Мачка voli рибу')
        expect(dict.words).toEqual(['voli'])
    })

    it('словари и слова не смешиваются между языками', () => {
        store.append(store.parse('block keyword variable'))
        expect(store.getWordPoolSize).toBe(base.pool + 3)
        expect(store.getDicts.length).toBe(base.dicts + 1)

        // у сербского своей базовой лексики нет, поэтому слепок пустой
        store.setLanguage('sr')
        expect(store.getWordPoolSize).toBe(0)
        expect(store.getDicts.length).toBe(0)

        store.append(store.parse('Mačka voli ribu'))
        expect(store.getWordPoolSize).toBe(3)

        store.setLanguage('en')
        expect(store.getWordPoolSize).toBe(base.pool + 3)
        expect(store.getDicts.length).toBe(base.dicts + 1)
    })

    it('append проставляет id словарю', () => {
        store.append(store.parse('block keyword variable'))

        const dict = store.getDicts[store.getDicts.length - 1]
        expect(dict.id).toBeTruthy()
        expect(store.getDictById(dict.id)).toBe(dict)
    })

    it('append не сбрасывает прогресс уже изучаемых слов', () => {
        store.append(store.parse('block keyword'))
        store.toLearn({ block: 'блок' })

        store.append(store.parse('block other stuff'))

        expect(store.getWordPool.block.level).toBe(1)
        expect(store.getWordPool.block.ru).toBe('блок')
        expect(store.getWordPool.block.frequency).toBe(2)
    })

    it('getWordStatus различает новое, изучаемое и выученное', () => {
        store.append(store.parse('block keyword variable'))
        store.toLearn({ block: 'блок' })

        expect(store.getWordStatus('block')).toBe('learn')
        expect(store.getWordStatus('keyword')).toBe('queue')
        expect(store.getWordStatus('zzzabsent')).toBe('unknown')

        store.getArchive.keyword = { level: 5 }
        expect(store.getWordStatus('keyword')).toBe('known')
    })

    it('фразы живут в отдельном пуле от слов', () => {
        store.append(store.parse('a code block here'))
        store.addPhrase('code block', 2)

        expect(store.getWordPool['code block']).toBeUndefined()
        expect(store.getPhrasePool['code block'].frequency).toBe(2)
        // небазовые слова из текста на месте
        expect(store.getWordPool.code).toBeTruthy()
    })

    it('повторное добавление фразы не сбрасывает прогресс', () => {
        store.addPhrase('code block', 2)
        store.setLearnMode('phrase')
        store.toLearn({ 'code block': 'блок кода' })

        store.addPhrase('code block', 99)

        expect(store.getPhrasePool['code block'].level).toBe(1)
        expect(store.getPhrasePool['code block'].ru).toBe('блок кода')
        expect(store.getPhrasePool['code block'].frequency).toBe(2)
    })

    it('режим переключает пул, с которым работает механика уровней', () => {
        const words = store.getWordPoolSize
        store.addPhrase('code block', 2)

        expect(store.getPoolSize).toBe(words)

        store.setLearnMode('phrase')
        expect(store.getPoolSize).toBe(1)
        expect(store.getForLearn(10)).toEqual(['code block'])
    })

    it('фраза проходит полный цикл до архива фраз', () => {
        store.addPhrase('code block', 2)
        store.setLearnMode('phrase')
        store.toLearn({ 'code block': 'блок кода' })

        for (let level = 1; level < 5; level++) {
            store.step()
            store.saveLesson({ 'code block': true })
        }
        expect(store.getPhrasePool['code block'].level).toBe(5)

        store.step()
        store.saveLesson({ 'code block': true })

        expect(store.getPhrasePool['code block']).toBeUndefined()
        expect(store.getPhraseArchive['code block'].ru).toBe('блок кода')
        // словарный запас слов при этом не тронут
        expect(store.getArchive['code block']).toBeUndefined()
    })

    it('step двигает счётчики и слов, и фраз', () => {
        store.append(store.parse('code block'))
        store.toLearn({ code: 'код' })
        store.addPhrase('code block', 1)
        store.setLearnMode('phrase')
        store.toLearn({ 'code block': 'блок кода' })

        store.step()

        expect(store.getWordPool.code.countdown).toBe(0)
        expect(store.getPhrasePool['code block'].countdown).toBe(0)
    })

    it('getPhraseStatus отражает стадию фразы', () => {
        expect(store.getPhraseStatus('code block')).toBe('unknown')

        store.addPhrase('code block', 1)
        expect(store.getPhraseStatus('code block')).toBe('queue')

        store.setLearnMode('phrase')
        store.toLearn({ 'code block': 'блок кода' })
        expect(store.getPhraseStatus('code block')).toBe('learn')
    })

    it('фразы не смешиваются между языками', () => {
        store.addPhrase('code block', 1)

        store.setLanguage('sr')
        expect(Object.keys(store.getPhrasePool).length).toBe(0)

        store.setLanguage('en')
        expect(store.getPhrasePool['code block']).toBeTruthy()
    })

    describe('resetProgress', () => {
        beforeEach(() => {
            provider.forEach(data => store.append(store.parse(data.text, data.name)))
            store.toLearn(translated)
            store.addPhrase('code block', 3)
            store.setLearnMode('phrase')
            store.toLearn({ 'code block': 'блок кода' })
            store.setLearnMode('word')
        })

        it('тексты остаются', () => {
            store.resetProgress()
            expect(store.getDicts.length).toBe(base.dicts + 2)
        })

        it('встроенный текст переживает сброс прогресса', () => {
            store.resetProgress()
            expect(store.getDictById(BUILTIN_DICT_ID)).toBeTruthy()
        })

        it('базовая лексика переживает сброс прогресса', () => {
            store.resetProgress()

            expect(Object.keys(store.getArchive).length).toBe(base.archive)
            expect(store.getArchive.the.basic).toBe(true)
            expect(store.getPhraseArchive['of course'].ru).toBe('конечно')
        })

        it('уровни обнуляются', () => {
            store.resetProgress()

            expect(Object.keys(store.getInterval(1)).length).toBe(0)
            expect(Object.keys(store.getInterval(0)).length).toBe(store.getWordPoolSize)
        })

        it('заработанный словарный запас очищается', () => {
            store.getArchive.keyword = { frequency: 2, ru: 'ключевое слово', level: 5 }
            store.resetProgress()

            // остаётся ровно базовая лексика, заработанное уходит
            expect(Object.keys(store.getArchive).length).toBe(base.archive)
            expect(store.getArchive.keyword).toBeUndefined()
        })

        it('выученное слово возвращается в пул, а не пропадает', () => {
            // повторяем судьбу слова: из пула в архив
            store.getArchive.keyword = { frequency: 2, ru: 'ключевое слово', level: 5 }
            delete store.getWordPool.keyword

            store.resetProgress()

            expect(store.getWordPool.keyword).toBeTruthy()
            expect(store.getWordPool.keyword.level).toBe(0)
            expect(store.getWordPool.keyword.frequency).toBe(2)
        })

        it('переводы сохраняются', () => {
            store.resetProgress()
            expect(store.getWordPool.block.ru).toBe('блок')
        })

        it('перевод берётся из архива, если в пуле слово без перевода', () => {
            // append() возвращает выученное слово в пул с ru: null,
            // при этом запись с переводом остаётся в архиве
            store.getArchive.block = { frequency: 1, ru: 'блок', level: 5 }
            store.getWordPool.block = { frequency: 1, ru: null, level: 0 }

            store.resetProgress()

            expect(store.getWordPool.block.ru).toBe('блок')
        })

        it('перевод из пула важнее архивного', () => {
            store.getArchive.block = { frequency: 1, ru: 'старый', level: 5 }
            store.getWordPool.block = { frequency: 1, ru: 'новый', level: 2 }

            store.resetProgress()

            expect(store.getWordPool.block.ru).toBe('новый')
        })

        it('фразы остаются, но обнуляются', () => {
            store.resetProgress()

            expect(store.getPhrasePool['code block']).toBeTruthy()
            expect(store.getPhrasePool['code block'].level).toBe(0)
            expect(store.getPhrasePool['code block'].ru).toBe('блок кода')
            expect(store.getPhrasePool['code block'].frequency).toBe(3)
        })

        it('базовые слова в очередь после сброса не возвращаются', () => {
            store.resetProgress()
            expect(store.getWordPool.the).toBeUndefined()
        })

        it('пул слов совпадает с тем, что дают тексты', () => {
            const before = store.getWordPoolSize
            store.resetProgress()

            expect(store.getWordPoolSize).toBe(before)
        })

        it('чистит все языки, а не только текущий', () => {
            store.setLanguage('sr')
            store.append(store.parse('Mačka voli ribu'))
            store.toLearn({ mačka: 'кошка' })
            store.setLanguage('en')

            store.resetProgress()

            store.setLanguage('sr')
            expect(store.getDicts.length).toBe(1)
            expect(store.getWordPool['mačka'].level).toBe(0)
        })

        it('после полного сброса состояние как у нового пользователя', () => {
            store.$reset()

            expect(() => store.resetProgress()).not.toThrow()
            expect(store.getWordPoolSize).toBe(base.pool)
            expect(store.getDicts.length).toBe(base.dicts)
            expect(store.getDictById(BUILTIN_DICT_ID)).toBeTruthy()
        })
    })

    describe('слова без перевода', () => {
        beforeEach(() => {
            provider.forEach(data => store.append(store.parse(data.text, data.name)))
        })

        it('на изучение не берутся', () => {
            store.toLearn({ block: null, keyword: '', variable: '   ', mocking: 'мокирование' })

            expect(store.getWordPool.block.level).toBe(0)
            expect(store.getWordPool.keyword.level).toBe(0)
            expect(store.getWordPool.variable.level).toBe(0)
            expect(store.getWordPool.mocking.level).toBe(1)
        })

        it('перевод чистится от пробелов по краям', () => {
            store.toLearn({ block: '  блок  ' })
            expect(store.getWordPool.block.ru).toBe('блок')
        })

        it('в урок не попадают, даже если уровень уже проставлен', () => {
            // так выглядят данные, сохранённые прежней версией
            store.getWordPool.block = { frequency: 4, ru: null, level: 1, countdown: 0 }
            store.getWordPool.keyword = { frequency: 1, ru: 'ключевое слово', level: 1, countdown: 0 }

            expect(Object.keys(store.getForLesson)).toEqual(['keyword'])
        })

        it('остаются в очереди и их можно перевести позже', () => {
            store.toLearn({ block: null })

            expect(store.getForLearn(200)).toContain('block')
            store.toLearn({ block: 'блок' })
            expect(store.getWordPool.block.level).toBe(1)
        })

        it('фразы без перевода тоже не берутся', () => {
            store.addPhrase('code block', 1)
            store.setLearnMode('phrase')

            store.toLearn({ 'code block': '' })
            expect(store.getPhrasePool['code block'].level).toBe(0)
        })
    })

    describe('кэш переводов предложений', () => {
        const sentence = 'The rabbit was late again.'

        it('переведённое предложение достаётся из кэша', () => {
            expect(store.getSentenceTranslation(sentence)).toBeNull()

            store.cacheSentence(sentence, 'Кролик снова опаздывал.')

            expect(store.getSentenceTranslation(sentence)).toBe('Кролик снова опаздывал.')
        })

        it('вёрстка страницы на кэш не влияет', () => {
            store.cacheSentence(sentence, 'Кролик снова опаздывал.')

            expect(store.getSentenceTranslation('The rabbit\nwas late again.'))
                .toBe('Кролик снова опаздывал.')
        })

        it('ключ — хэш, а не само предложение', () => {
            store.cacheSentence(sentence, 'Кролик снова опаздывал.')

            expect(Object.keys(store.current.sentences)).not.toContain(sentence)
        })

        it('перевод хранится отдельно по языкам', () => {
            store.cacheSentence(sentence, 'Кролик снова опаздывал.')
            store.setLanguage('sr')

            expect(store.getSentenceTranslation(sentence)).toBeNull()
        })

        it('кэш не растёт бесконечно: старое вытесняется', () => {
            const total = SENTENCE_CACHE_LIMIT + 10

            for (let i = 0; i < total; i++) {
                store.cacheSentence(`Sentence number ${i}.`, `Предложение ${i}.`)
            }

            expect(Object.keys(store.current.sentences).length).toBeLessThanOrEqual(SENTENCE_CACHE_LIMIT)
            // свежие переводы на месте, самые первые вытеснены
            expect(store.getSentenceTranslation(`Sentence number ${total - 1}.`)).toBe(`Предложение ${total - 1}.`)
            expect(store.getSentenceTranslation('Sentence number 0.')).toBeNull()
        })
    })

    it('saveLesson', () => {
        provider.forEach(data => store.append(store.parse(data.text, data.name)))
        store.toLearn(translated)
        store.step()

        let lesson = store.getForLesson

        lesson.block = true
        lesson.keyword = true
        lesson.variable = true
        lesson.mocking = false
        lesson.helper = false

        store.saveLesson(lesson)

        expect(Object.keys(store.getInterval(1)).length).toBe(2)
        expect(Object.keys(store.getInterval(2)).length).toBe(3)
    })
})