import { expect, describe, it, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWordsStore } from './words'

let store = null
let provider = [
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

describe('Words Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        store = useWordsStore()
    })

    it.each(provider)('parse', (data) => {
        let dict = store.parse(data.text, data.name)

        expect(dict.text).toBe(data.text)
        expect(dict.name).toBe(data.name)

        expect(dict.words.length).toBe(data.wordCount)
        expect(dict.frequency.the).toBe(data.theCount)
        expect(dict.frequency.keyword).toBe(data.keywordCount)
    })

    it('append', () => {
        provider.forEach(data => store.append(store.parse(data.text, data.name)))

        expect(store.getWordPoolSize).toBe(62)
        expect(store.getDicts.length).toBe(2)
    })

    it('toLearn', () => {
        provider.forEach(data => store.append(store.parse(data.text, data.name)))

        store.toLearn(5)
        expect(Object.keys(store.getInterval(1)).length).toBe(5)
    })

    // it('translate', async () => {
    it.skip('translate', async () => {
        provider.forEach(data => store.append(store.parse(data.text, data.name)))

        const words = Object.keys(store.getInterval(0))
        const result = await store.translate(words)

        expect(result.length).toBe(words.length)
    })
})