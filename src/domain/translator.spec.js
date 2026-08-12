import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildPrompt, cleanTranslation, translateAll, TRANSLATOR_MODEL, WORD_TIMEOUT } from './translator'

/** ответ в формате OpenAI-совместимого API, как его отдаёт LM Studio */
function reply(content) {
    return {
        ok: true,
        json: async () => ({ choices: [{ message: { content } }] }),
    }
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('cleanTranslation', () => {
    it('оставляет чистый перевод как есть', () => {
        expect(cleanTranslation('кролик', 'rabbit')).toBe('кролик')
    })

    it('срезает кавычки', () => {
        expect(cleanTranslation('"сдаться"', 'give up')).toBe('сдаться')
        expect(cleanTranslation('«сдаться»', 'give up')).toBe('сдаться')
    })

    it('срезает точку в конце', () => {
        // реальный ответ translategemma на фразу
        expect(cleanTranslation('отказаться от; сдаться.', 'give up on'))
            .toBe('отказаться от; сдаться')
    })

    it('многоточие не трогает', () => {
        expect(cleanTranslation('и так далее...', 'et cetera')).toBe('и так далее...')
    })

    it('срезает повтор метки языка', () => {
        // реальный ответ на сербском: модель повторяет обе метки
        expect(cleanTranslation('Сербский: кошка\nРусский: кошка', 'mačka')).toBe('кошка')
    })

    it('срезает повтор исходного слова перед переводом', () => {
        // реальный ответ на «of»
        expect(cleanTranslation('of - из; от; о; для.', 'of')).toBe('из; от; о; для')
    })

    it('пропускает строку, где модель вернула исходник', () => {
        expect(cleanTranslation('воли рибу\nХочет рыбу.', 'воли рибу')).toBe('Хочет рыбу')
    })

    it('отбрасывает толкование вместо перевода', () => {
        // так модель отвечает на артикли: перевода нет, есть грамматическая справка
        const explanation = 'the\nопределенный артикль, используется перед существительными '
            + 'в единственном числе, обозначающими конкретный предмет'

        expect(cleanTranslation(explanation, 'the')).toBe('')
    })

    it('длинный перевод длинной фразы не считается толкованием', () => {
        const source = 'she did not give up on the white rabbit'
        const translation = 'она не отказалась от белого кролика'

        expect(cleanTranslation(translation, source)).toBe(translation)
    })

    it('модель вернула ровно исходник — перевода нет', () => {
        expect(cleanTranslation('a', 'a')).toBe('')
    })

    it('переживает пустой ответ', () => {
        expect(cleanTranslation('', 'x')).toBe('')
        expect(cleanTranslation(null, 'x')).toBe('')
        expect(cleanTranslation(undefined, 'x')).toBe('')
    })
})

describe('buildPrompt', () => {
    it('строится на языковых метках, без переводимой инструкции', () => {
        expect(buildPrompt('give up', 'English', 'Russian')).toBe('English: give up\nRussian:')
    })

    it('уважает направление перевода', () => {
        expect(buildPrompt('mačka', 'Serbian', 'Russian')).toBe('Serbian: mačka\nRussian:')
    })
})

describe('translateAll', () => {
    it('переводит по одному запросу на элемент и сохраняет порядок', async () => {
        const seen = []
        vi.stubGlobal('fetch', vi.fn(async (url, options) => {
            const body = JSON.parse(options.body)
            seen.push(body.messages[0].content)
            expect(body.model).toBe(TRANSLATOR_MODEL)
            return reply({ cat: 'кот', dog: 'собака' }[body.messages[0].content.match(/^[^:]+:\s*(.*)\n/)[1]])
        }))

        const result = await translateAll(['cat', 'dog'], { from: 'English', to: 'Russian' })

        expect(result).toEqual(['кот', 'собака'])
        expect(seen.length).toBe(2)
    })

    it('сбой одного элемента не сдвигает остальные переводы', async () => {
        vi.stubGlobal('fetch', vi.fn(async (url, options) => {
            const word = JSON.parse(options.body).messages[0].content.match(/^[^:]+:\s*(.*)\n/)[1]
            if (word === 'dog') {
                return { ok: false, status: 500 }
            }
            return reply({ cat: 'кот', bird: 'птица' }[word])
        }))

        const result = await translateAll(['cat', 'dog', 'bird'], { from: 'English', to: 'Russian' })

        // главное — «птица» не съехала на позицию «dog»
        expect(result).toEqual(['кот', null, 'птица'])
    })

    it('недоступный сервер даёт массив из null нужной длины', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))

        const result = await translateAll(['cat', 'dog'], { from: 'English', to: 'Russian' })

        expect(result).toEqual([null, null])
    })

    it('сообщает о прогрессе', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => reply('перевод')))
        const steps = []

        await translateAll(['a', 'b', 'c'], {
            from: 'English',
            to: 'Russian',
            onProgress: (done, total) => steps.push(`${done}/${total}`),
        })

        expect(steps).toEqual(['1/3', '2/3', '3/3'])
    })

    it('пустой список не ходит в сеть', async () => {
        const fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)

        expect(await translateAll([], { from: 'English', to: 'Russian' })).toEqual([])
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('прерывание по signal останавливает очередь', async () => {
        const controller = new AbortController()
        const fetchMock = vi.fn(async () => {
            controller.abort()
            return reply('перевод')
        })
        vi.stubGlobal('fetch', fetchMock)

        const result = await translateAll(['a', 'b', 'c'], {
            from: 'English',
            to: 'Russian',
            signal: controller.signal,
        })

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(result).toEqual(['перевод', null, null])
    })
})

describe('таймаут', () => {
    it('по умолчанию слово ждём три секунды', () => {
        expect(WORD_TIMEOUT).toBe(3000)
    })

    it('зависший запрос обрывается по таймауту', async () => {
        vi.stubGlobal('fetch', vi.fn((url, { signal }) => new Promise((resolve, reject) => {
            // сервер не отвечает никогда — ждём только сигнал отмены
            signal.addEventListener('abort', () => reject(signal.reason))
        })))

        const started = Date.now()
        const result = await translateAll(['cat'], { from: 'English', to: 'Russian', timeout: 50 })

        expect(result).toEqual([null])
        expect(Date.now() - started).toBeLessThan(1000)
    })

    it('зависшее слово не рушит остальную очередь', async () => {
        vi.stubGlobal('fetch', vi.fn((url, options) => {
            const word = JSON.parse(options.body).messages[0].content.match(/^[^:]+:\s*(.*)\n/)[1]

            if (word === 'dog') {
                return new Promise((resolve, reject) => {
                    options.signal.addEventListener('abort', () => reject(options.signal.reason))
                })
            }
            return Promise.resolve(reply({ cat: 'кот', bird: 'птица' }[word]))
        }))

        const result = await translateAll(['cat', 'dog', 'bird'], {
            from: 'English', to: 'Russian', timeout: 50,
        })

        expect(result).toEqual(['кот', null, 'птица'])
    })

    it('отмена пользователем прекращает очередь, а таймаут — нет', async () => {
        const controller = new AbortController()
        const fetchMock = vi.fn(() => {
            controller.abort()
            return new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error('поздно')), 10)
            })
        })
        vi.stubGlobal('fetch', fetchMock)

        await translateAll(['a', 'b', 'c'], {
            from: 'English', to: 'Russian', signal: controller.signal, timeout: 50,
        })

        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})
