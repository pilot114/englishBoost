/**
 * Перевод через локальную модель (LM Studio, OpenAI-совместимый API).
 *
 * По умолчанию запрос идёт на относительный путь /llm — его проксирует dev-сервер
 * vite на http://127.0.0.1:1234. Так браузер видит запрос как свой собственный
 * origin, и CORS в LM Studio включать не нужно.
 *
 * Для статической сборки без прокси задайте абсолютный адрес в VITE_TRANSLATOR_URL
 * и включите CORS в настройках сервера LM Studio.
 */
export const TRANSLATOR_URL =
    import.meta.env?.VITE_TRANSLATOR_URL ?? '/llm/v1/chat/completions'

export const TRANSLATOR_MODEL =
    import.meta.env?.VITE_TRANSLATOR_MODEL ?? 'translategemma-12b-it'

/**
 * Промпт в виде языковых меток, а не инструкции.
 *
 * translategemma — модель-переводчик, она переводит всё, что получила. Если дать
 * ей инструкцию «Translate the following text…», то на словах, у которых нет
 * самостоятельного перевода (артикли, предлоги), переводить будет нечего — и
 * моделью будет переведена сама инструкция. Метки «English:/Russian:» перевести
 * нельзя, поэтому такой утечки не происходит.
 */
export function buildPrompt(text, from, to) {
    return `${from}: ${text}\n${to}:`
}

// перевод длиннее исходника во столько раз — это уже толкование, а не перевод
const MAX_RATIO = 8
const MAX_LENGTH = 60

function stripNoise(line, source) {
    let result = line
        // «Русский: кошка» — модель повторяет метку языка
        .replace(/^\p{L}{1,20}\s*:\s*/u, '')

    if (source) {
        // «of - из; от; о» — модель повторяет исходное слово перед переводом
        const escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        result = result.replace(new RegExp(`^${escaped}\\s*[-—–:]\\s*`, 'iu'), '')
    }

    return result
        .replace(/^["'«»]+|["'«»]+$/g, '')
        // модель заканчивает перевод точкой («сдаться.») — в карточке она лишняя
        .replace(/(?<!\.)\.$/, '')
        .trim()
}

/**
 * Достаёт перевод из ответа модели. Пустая строка означает, что вменяемого
 * перевода нет — лучше показать это честно, чем положить в карточку мусор.
 */
export function cleanTranslation(raw, source = '') {
    const lines = String(raw ?? '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)

    for (const line of lines) {
        const candidate = stripNoise(line, source)

        if (!candidate) {
            continue
        }
        // модель просто вернула исходник — переводить оказалось нечего
        if (candidate.toLowerCase() === source.toLowerCase()) {
            continue
        }
        // развёрнутое объяснение вместо перевода (частый ответ на артикли)
        if (candidate.length > MAX_LENGTH && candidate.length > source.length * MAX_RATIO) {
            continue
        }
        return candidate
    }

    return ''
}

/**
 * Сколько ждём ответа на слово или фразу. Прогретая модель отвечает за ~1 секунду,
 * поэтому три — это уже признак того, что она зависла: лучше отдать пустой
 * результат и не блокировать очередь, чем ждать бесконечно.
 */
export const WORD_TIMEOUT = 3000

/** предложение переводится дольше слова, здесь запас нужен больше */
export const SENTENCE_TIMEOUT = 30000

/** внешняя отмена и таймаут — два независимых повода прервать запрос */
function abortSignal(signal, timeout) {
    const signals = []

    if (signal) {
        signals.push(signal)
    }
    if (timeout) {
        signals.push(AbortSignal.timeout(timeout))
    }
    if (!signals.length) {
        return undefined
    }
    return signals.length === 1 ? signals[0] : AbortSignal.any(signals)
}

/** один запрос к модели; бросает исключение, если сервер недоступен, завис или ответил ошибкой */
export async function translateOne(text, { from, to, signal, timeout = WORD_TIMEOUT } = {}) {
    const response = await fetch(TRANSLATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortSignal(signal, timeout),
        body: JSON.stringify({
            model: TRANSLATOR_MODEL,
            temperature: 0,
            messages: [{ role: 'user', content: buildPrompt(text, from, to) }],
        }),
    })

    if (!response.ok) {
        throw new Error(`Переводчик ответил ${response.status}`)
    }

    const data = await response.json()
    return cleanTranslation(data?.choices?.[0]?.message?.content, text) || null
}

/**
 * Переводит список по одному элементу за запрос.
 *
 * Пакетный перевод «всё одной строкой с разделителями» короче, но модель может
 * склеить или разбить элементы — и тогда переводы молча съедут на соседние слова.
 * Поштучный перевод гарантирует, что результат[i] относится именно к items[i];
 * не переведённые элементы возвращаются как null.
 */
export async function translateAll(items, { from, to, signal, timeout, onProgress } = {}) {
    const result = new Array(items.length).fill(null)
    let done = 0

    for (let i = 0; i < items.length; i++) {
        if (signal?.aborted) {
            break
        }
        try {
            result[i] = await translateOne(items[i], { from, to, signal, timeout })
        } catch (error) {
            // отменил пользователь — прекращаем очередь; зависло на одном слове —
            // отдаём по нему null и идём дальше, иначе одно слово рушит весь батч
            if (signal?.aborted) {
                break
            }
            console.error(`не удалось перевести «${items[i]}»:`, error)
        }
        onProgress?.(++done, items.length)
    }

    return result
}
