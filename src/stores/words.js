import { defineStore } from 'pinia'

/**
 * get part of object
 *
 * data = { a: 1, b: 2, c: 3, d: 4}
 * res = subset(data, (k,v) => v % 2)
 * // res: { a: 1, c: 3}
 */
function subset(obj, filterFn) {
    const filteredEntries = Object.entries(obj)
        .filter(([key, value]) => filterFn(key, value))
    return Object.fromEntries(filteredEntries)
}

function getMaxByField(obj, field, limit) {
    const entries = Object.entries(obj)
    entries.sort(([, a], [, b]) => b[field] - a[field])
    return entries.slice(0, limit).map(([key]) => key)
}

export const useWordsStore = defineStore('main', {
    state: () => ({
        dictionaries: [],
        wordPool: {},
        archive: {},
        maxLevel: 5,
    }),
    getters: {
        getMaxLevel: (state) => state.maxLevel,
        getDicts: (state) => state.dictionaries,
        getWordPoolSize: (state) => Object.keys(state.wordPool).length,
        getInterval: (state) => {
            return (level) => subset(state.wordPool, (k, v) => v.level === level)
        },
        getForLearn: (state) => {
            return (count) => getMaxByField(subset(state.wordPool, (k, v) => v.level === 0), 'frequency', count)
        },
        getForLesson: (state) => subset(state.wordPool, (k, v) => v.countdown === 0 && v.level > 0),
        getArchive: (state) => state.archive,
    },
    actions: {
        /**
         * create Dictionary from text
         */
        parse(text) {
            // list all latin words in lower case with save order
            let words = text
                .split(/[\s,.!?]+/)
                .map(x => x.trim())
                .map(x => x.replace(/[^a-zA-Z]/g,'').toLowerCase())
                .filter(x => x)

            let frequency = {}
            words.forEach(x => frequency[x] = (frequency[x] || 0) + 1)
            return { text, words, frequency }
        },

        append(dict) {
            this.dictionaries.push(dict)
            // tmp for performance
            let tmp = JSON.parse(JSON.stringify(this.wordPool))

            Object.keys(dict.frequency).forEach(word => {
                tmp[word] = {
                    frequency: (this.wordPool[word]?.frequency ?? 0) + dict.frequency[word],
                    ru: null,
                    level: 0,
                };
            });
            this.wordPool = tmp
        },

        toLearn(words) {
            let all = JSON.parse(JSON.stringify(this.wordPool))
            Object.entries(words).forEach(([word, ru]) => {
                all[word].level = 1
                all[word].countdown = 1
                all[word].ru = ru
            })

            this.wordPool = all
        },

        async translate(words) {
            const text = words.join(' | ')

            const url = 'https://translate281.p.rapidapi.com/'
            const options = {
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'X-RapidAPI-Key': 'a544bfbff2msh967f695475cae17p1d6dffjsn5dff1d7411ac',
                    'X-RapidAPI-Host': 'translate281.p.rapidapi.com'
                },
                body: new URLSearchParams({
                    text,
                    from: 'en',
                    to: 'ru'
                })
            }

            try {
                const response = await fetch(url, options)
                const text = await response.text()
                const data = JSON.parse(text).response
                return data.split('|').map(x => x.trim())
            } catch (error) {
                console.error(error)
            }
        },

        step() {
            let tmp = JSON.parse(JSON.stringify(this.wordPool))

            Object.keys(this.wordPool).forEach((word) => {
                if (tmp[word].countdown > 0) {
                    tmp[word].countdown--
                }
            })
            this.wordPool = tmp
        },

        saveLesson(words) {
            let tmp = JSON.parse(JSON.stringify(this.wordPool))

            Object.entries(words).forEach(([word, result]) => {
                if (!result) {
                    if (tmp[word].level > 1) {
                        tmp[word].level = 1
                        tmp[word].countdown = tmp[word].level
                    }
                    return
                }

                if (tmp[word].level === this.maxLevel) {
                    this.archive[word] = tmp[word]
                    delete tmp[word]
                    return
                }

                tmp[word].level++
                tmp[word].countdown = tmp[word].level
            })

            this.wordPool = tmp
        },
    },
    persist: true,
})