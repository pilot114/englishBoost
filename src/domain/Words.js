/**
 * Dictionary & Book - 2 базовые структуры данных
 * array<string> words - слова
 * string type - название
 * string variant - цвет
 * string description - описание
 */
export function Dictionary(words, type, variant, description) {
    this.words = words;
    this.type = type;
    this.variant = variant;
    this.description = description;
}

export function Book(text, title, description, mode = 'english') {
    // this.phrases = [];
    this.totalWordCount = 0;
    this.words = [];
    this.pareto = [];
    this.paretoLimit = 0.5;
    this.title = title;
    this.description = description;

    // используется только в процессе добавления книги, можно не сохранять
    this.counters = null;
    this.uniqCount = 0;

    this.getUnknownCount = function () {
        return this.words.filter(word =>  word[2] === 'unknown').length;
    };
    this.getLearnCount = function () {
        return this.words.filter(word => word[2] === 'learn').length;
    };
    this.getKnownCount = function () {
        return this.words.filter(word => word[2] === 'known').length;
    };

    this.objectSort = function (obj) {
        let sortable = [];
        for (let property in obj) {
            sortable.push([property, obj[property]]);
        }
        sortable.sort((a, b) => {
            return b[1] - a[1];
        });
        return sortable;
    };

    // TODO: нужно выводить больше инфы по частотке.
    // слова (с %) которые встречаются 1 раз (нужнее тем, кто хорошо знает язык)
    // слова (с %) которые составляют значимую часть (нужнее новичкам) - градации Парето
    this.calcPareto = function () {
        let acc = 0;
        // слова уже отсортированы, поэтому выходим, когда идут нетоповые слова
        for (let i = 0; i < this.words.length; i++) {
            this.pareto.push(this.words[i][0]);
            acc += this.words[i][1];
            if (acc > this.totalWordCount * this.paretoLimit) {
                break;
            }
        }
    };

    if (text) {
        // TODO: по фразам можно показывать контекст слова
        // this.phrases = text.split(/[.!?]/).filter(phrase => {
        //     return phrase.length > 0;
        // });

        let words = text.split(/(\s+)/);
        if (mode === 'english') {
            words = words
                .map(word => {
                    return word
                        .toLowerCase()
                        .replace(/^\W+/, '')
                        .replace(/\W+$/, '')
                        .replace(/^[0-9.,]+$/, '')
                });
        }
        if (mode === 'russian') {
            words = words
                .map(word => {
                    return word.split(';')[0]
                });
        }
        words = words.filter(word => word.length > 0 && word !== '\n' && word !== '\r\n');
        // console.log(words);
        // return;

        this.totalWordCount = words.length;

        let uniqWords = {};
        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            if (uniqWords.hasOwnProperty(word)) {
                uniqWords[word]++;
            } else {
                uniqWords[word] = 1;
            }
        }
        this.words = this.objectSort(uniqWords);
        this.uniqCount = this.words.length;
    }
}