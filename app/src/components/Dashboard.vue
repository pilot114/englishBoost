<template>
    <b-row>
        <b-col>
            <b-form-group>
                <b-file accept="text/*" v-model="textFile"></b-file>
            </b-form-group>

            <b-card v-if="newBook">
                <b-form-group>
                    <b-input v-model="newBook.title" placeholder="title"></b-input>
                    <b-input v-model="newBook.description" placeholder="description"></b-input>
                </b-form-group>
                <p class="card-text">Всего слов: {{ newBook.totalWordCount }}</p>
                <p class="card-text">Уникальных: {{ newBook.uniqCount }}</p>
                <p class="card-text">Из них:</p>
                <p class="card-text">Знаю - {{ newBook.counters.known }}</p>
                <p class="card-text">Изучаю - {{ newBook.counters.learn }}</p>
                <p class="card-text">Не знаю - {{ newBook.counters.unknown }}</p>
                <p class="card-text">Новые (будут добавлены в "Не знаю") - {{ newBook.counters.new }}</p>
                <p class="card-text">Стоп-слова - {{ newBook.counters.stopword }}</p>
                <b-button size="sm" variant="outline-secondary" @click="addBook">Add to library</b-button>
            </b-card>
        </b-col>

        <b-col>
            <b>Library</b>
            <div v-for="book in books">
                <b-card :title="book.title + ' (' + book.words.length + ')'">
                    <p class="card-text">{{book.description}}</p>
                    <b-form-group>
                        <b-progress class="mt-1" show-value :max="book.words.length">
                            <b-progress-bar show-value :value="book.getUnknown()" variant="danger"></b-progress-bar>
                            <b-progress-bar show-value :value="book.getLearn()" variant="warning"></b-progress-bar>
                            <b-progress-bar show-value :value="book.getKnown()" variant="success"></b-progress-bar>
                        </b-progress>
                    </b-form-group>
                    <b-form-group>
                        <b-button size="sm" variant="outline-secondary" @click="$emit('explore', book)">Explore</b-button>
                        <b-button size="sm" variant="outline-danger" @click="removeBook(book)">Delete</b-button>
                    </b-form-group>
                </b-card>
            </div>
        </b-col>

        <b-col>
            <b>Common dictionaries</b>
            <b-card v-for="(dict, dictName) in dicts" :key="dictName"
                    :title="dict.type + ' (' + dict.words.length + ')'">
                <p class="card-text">{{dict.description}}</p>
                <b-form-group>
                    <b-progress class="mt-1" show-value>
                        <b-progress-bar show-progress :value="100" :variant=dict.variant></b-progress-bar>
                    </b-progress>
                </b-form-group>
                <b-form-group>
                    <b-button size="sm" variant="outline-secondary" @click="$emit('training', dict)">Training</b-button>
                </b-form-group>
            </b-card>
        </b-col>
    </b-row>
</template>

<script>

    function getStopWords() {
        return [
            // articles
            'a', 'an', 'the',
            // pronouns
            'all', 'another', 'any', 'anybody', 'anyone', 'anything', 'both',
            'each', 'either', 'everybody', 'everyone', 'everything',
            'few', 'he', 'her', 'hers', 'herself', 'him', 'himself', 'his',
            'i', 'it', 'its', 'itself', 'many', 'me', 'mine', 'more', 'most', 'much', 'my', 'myself',
            'neither', 'nobody', 'none', 'nothingone', 'other', 'others', 'our', 'ours' ,
            'ourselves', 'several', 'she', 'some', 'somebody', 'someone', 'something',
            'that', 'their', 'theirs', 'them', 'themselves', 'these', 'they', 'this', 'those',
            'us', 'we', 'what', 'whatever', 'which', 'whichever', 'who', 'whoever', 'whom',
            'whomever', 'whose', 'you', 'your', 'yours', 'yourself', 'yourselves',
            // preposition
            'aboard', 'about', 'above', 'across', 'after', 'against', 'along',
            'amid', 'among', 'anti', 'around', 'asat', 'before',
            'behind', 'below', 'beneath', 'beside', 'besides', 'between', 'beyond', 'but', 'by',
            'concerning', 'considering', 'despite', 'down', 'during',
            'except', 'excepting', 'excluding',
            'following', 'for', 'from', 'in', 'inside', 'into', 'like',
            'minus', 'near', 'of', 'off', 'on', 'onto', 'opposite', 'outside', 'over',
            'past', 'per', 'plus', 'regarding', 'round', 'save', 'since', 'than',
            'through', 'to', 'toward', 'towards',
            'under', 'underneath', 'unlike', 'until', 'up', 'upon',
            'versus', 'via', 'with', 'within', 'without',
            // conjunction
            'and', 'that', 'but', 'or', 'as', 'if', 'when', 'than', 'because',
            'while', 'where', 'after', 'so', 'though', 'since', 'until',
            'whether', 'before', 'although', 'nor', 'like', 'once',
            'unless', 'now', 'except'
        ];
    }

    function loadBooks() {
        var booksSerialized = JSON.parse(localStorage.getItem('books'));
        if (!booksSerialized) {
            return;
        }
        var books = [];
        for (var i = 0; i < booksSerialized.length; i++) {
            var book = new Book(null, booksSerialized[i].title, booksSerialized[i].description);
            // book.phrases = booksSerialized[i].phrases;
            book.totalWordCount = booksSerialized[i].totalWordCount;
            book.words = booksSerialized[i].words;
            book.pareto = booksSerialized[i].pareto;
            book.paretoLimit = booksSerialized[i].paretoLimit;
            books.push(book);
        }
        return books;
    }

    function loadDicts() {
        return JSON.parse(localStorage.getItem('dicts'));
    }

    function Dictionary(words, type, variant, description) {
        this.words = words;
        this.type = type;
        this.variant = variant;
        this.description = description;
    }

    function Book(text, title, description) {
        // this.phrases = [];
        this.totalWordCount = 0;
        this.words = [];
        this.pareto = [];
        this.paretoLimit = 0.8;
        this.title = title;
        this.description = description;

        // используется только в процессе добавления книги, можно не сохранять
        this.counters = null;
        this.uniqCount = 0;

        this.getUnknown = function() {
            return this.words.filter(function(word){
                return word[2] == 'unknown';
            }).length;
        }
        this.getLearn = function() {
            return this.words.filter(function(word){
                return word[2] == 'learn';
            }).length;
        }
        this.getKnown = function() {
            return this.words.filter(function(word){
                return word[2] == 'known';
            }).length;
        }

        this.objectSort = function(obj) {
            var sortable = [];
            for (var property in obj) {
                sortable.push([property, obj[property]]);
            }
            sortable.sort(function(a, b) {
                return b[1] - a[1];
            });
            return sortable;
        }

        this.calcPareto = function() {
            var acc = 0;
            for (var i = 0; i < this.words.length; i++) {
                this.pareto.push(this.words[i][0]);
                acc += this.words[i][1];
                if (acc > this.words.length * this.paretoLimit) {
                    break;
                }
            }
        }

        if (!text) {
            return null;
        }

        // this.phrases = text.split(/[.!?]/).filter(function(phrase){
        //     return phrase.length > 0;
        // });

        var words = text.split(/(\s+)/);
        for (var i = 0; i < words.length - 1; i++) {
            words[i] += " ";
        }
        this.totalWordCount = words.length;

        words = words.map(function(word){
            // left+right smart trim
            return word.toLowerCase().replace(/^\W+/, '').replace(/\W+$/, '');
        }).filter(function(word){
            return word.length > 0;
        });

        var uniqWords = {};
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            if (uniqWords.hasOwnProperty(word) ) {
                uniqWords[word]++;
            } else {
                uniqWords[word] = 1;
            }
        }
        this.words = this.objectSort(uniqWords);
        this.uniqCount = this.words.length;
    }

    export default {
        name: 'Dashboard',
        data() {
            return {
                books: loadBooks() || [],

                dicts: loadDicts() || {
                    unknown:  new Dictionary([], 'unknown', 'danger', 'Что не знаю'),
                    learn:    new Dictionary([], 'learn', 'warning',  'Что изучить'),
                    known:    new Dictionary([], 'known', 'success',  'Что знаю'),
                    stopword: new Dictionary(getStopWords(), 'stopwords', 'info', 'Частовстречаемые общие слова'),
                },

                loaded: false,

                textFile: null, // File object
                text: null,
                newBook: null,
            }
        },
        mounted: function () {
            this.$root.$on('toggleStateWord', (data) => {

                // перемещаем слово в новый словарь
                this.dicts[data.oldState].words = this.dicts[data.oldState].words.filter(function(word){
                    return word !== data.word;
                });
                this.dicts[data.newState].words.push(data.word);

                // в книгах state слова тоже должен меняться
                for (var i = 0; i < this.books.length; i++) {
                    var book = this.books[i];
                    for (var j = 0; j < book.words.length; j++) {
                        var word = book.words[j];
                        if (word[0] === data.word) {
                            this.books[i].words[j][2] = data.newState;
                        }
                    }
                }

                this.saveBooksAndDicts();
            });
        },
        watch: {
            textFile: function() {
                if (this.textFile) {
                    let reader = new FileReader();
                    reader.onload = () => {
                        this.text = reader.result;
                        this.newBook = new Book(this.text, this.textFile.name);

                        // фильтруем стоп-слова
                        var countStopword = 0;
                        this.newBook.words = this.newBook.words.filter((word) => {
                            if (this.dicts.stopword.words.indexOf(word[0]) !== -1) {
                                countStopword++;
                                return false;
                            }
                            return true;
                        });

                        // считаем pareto
                        this.newBook.calcPareto();

                        // находим слова, которые уже есть в словарях и проставляем им type
                        var counters = {
                            new: 0,
                            unknown: 0,
                            learn: 0,
                            known: 0,
                            stopword: countStopword
                        };
                        for (var i = 0; i < this.newBook.words.length; i++) {
                            var word = this.newBook.words[i][0];

                            // временный тип 'new', при добавлении будет заменён на unknown
                            var type = 'new';
                            if (this.dicts.unknown.words.indexOf(word) !== -1) {
                                type = 'unknown';
                                counters.unknown++;
                            }
                            if(this.dicts.learn.words.indexOf(word) !== -1) {
                                type = 'learn';
                                counters.learn++;
                            }
                            if(this.dicts.known.words.indexOf(word) !== -1) {
                                type = 'known';
                                counters.known++;
                            }
                            if (type === 'new') {
                                counters.new++;
                            }
                            this.newBook.words[i][2] = type;
                            this.newBook.counters = counters;
                        }
                    };
                    reader.readAsText(this.textFile);
                }
            },
        },
        methods: {
            addBook(event) {
                this.books.push(this.newBook);

                // раскидываем слова по словарям в соотвествии с их типами
                for (var i = 0; i < this.newBook.words.length; i++) {
                    var wordInfo = this.newBook.words[i];
                    if (wordInfo[2] == 'new') {
                        wordInfo[2] = 'unknown';
                    }

                    // добавляем в словарь, если слова там ещё нет
                    if(this.dicts[wordInfo[2]].words.indexOf(wordInfo[0]) == -1) {
                        this.dicts[wordInfo[2]].words.push(wordInfo[0]);
                    }
                }

                this.newBook = null;

                this.saveBooksAndDicts();
            },
            removeBook(book) {
                this.books = this.books.filter((item) => {
                    return item.title !== book.title;
                });
                this.saveBooksAndDicts();
            },
            saveBooksAndDicts() {
                var booksSerialized = [];
                for (var i = 0; i < this.books.length; i++) {
                    booksSerialized.push({
                        // phrases:        books[i].phrases,
                        totalWordCount: this.books[i].totalWordCount,
                        words:          this.books[i].words,
                        pareto:         this.books[i].pareto,
                        paretoLimit:    this.books[i].paretoLimit,
                        title:          this.books[i].title,
                        description:    this.books[i].description,
                    });
                }
                try {
                    localStorage.setItem('books', JSON.stringify(booksSerialized));
                    localStorage.setItem('dicts', JSON.stringify(this.dicts));
                } catch (e) {
                    if (e === QUOTA_EXCEEDED_ERR) {
                        alert('localStorage overflow');
                    }
                }
            },
        }
    }
</script>
