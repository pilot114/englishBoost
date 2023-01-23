/**
 * high-level API for work with Dictionaries
 */
class ParsedDictionary {
    constructor(text = '', words = [], frequency = {}) {
        this.text = text;
        this.words = words;
        this.frequency = frequency;
    }
}

class WordPool {
    words = {}

    // TODO: call lang API
    mix (dict) {
        const currentWords = Object.keys(this.words);
        const appendWords = Object.keys(dict.frequency);

        appendWords.forEach(word => {
            const isNew = !currentWords.includes(word);
            if (isNew) {
                this.words[word] = {
                    frequency: dict.frequency[word],
                    rus: null,
                }
            } else {
                this.words[word].frequency += dict.frequency[word]
            }
        });
    }
}

export default class Engine {
    // words with language-specific meta info
    wordPool = new WordPool();
    #dictionaries = [];

    intervals = [
        [], // every day
        [],
        [],
        [],
        [], // 1 in 5 days
    ]

    // learned
    archive = [];

    /**
     * add to learning flow
     */

    parse(text) {
        // list all words in lower case with save order
        let words = text
            .split(/[\s,.!?]+/)
            .filter(x => x)
            .map(x => x.replace(/[^a-zA-Z]/g,'').toLowerCase())
        ;

        let wordFrequency = {};
        words.forEach(x => wordFrequency[x] = (wordFrequency[x] || 0) + 1);

        return new ParsedDictionary(text, words, wordFrequency);
    }

    append(parsedDict) {
        // all info
        this.#pushToDicts(parsedDict);
        // words info
        this.#mixToPool(parsedDict);
    }

    #pushToDicts(dict) {
        // TODO: append context info
        return this.#dictionaries.push(dict);
    }

    #mixToPool(dict) {
        this.wordPool.mix(dict);
    }

    /**
     * translate
     */
    getTop100ForTranslate(){
        return []
    }

    setTranslate(words){

    }

    /**
     * preview
     */
    getDicts(){

    }
    getWordPool(){

    }
    getIntervals(){

    }

    /**
     * learning flow
     */
    loadTop100() {
        // TODO: add to intervals
    }

    getFromInterals() {
        // TODO: get from intervals
    }
    setToInterals() {
    }
}