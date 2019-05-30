<template>
    <b-row>
        <!-- preloader-->
        <div class="lds-dual-ring" v-if="loading"></div>

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
                        <b-button size="sm" variant="outline-secondary" @click="$emit('explore', book)">Explore
                        </b-button>
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
    // TODO: вынести в компоненты

    /**
     * Dictionary & Book - 2 базовые структуры данных
     */
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
        this.paretoLimit = 0.5;
        this.title = title;
        this.description = description;

        // используется только в процессе добавления книги, можно не сохранять
        this.counters = null;
        this.uniqCount = 0;

        this.getUnknown = function () {
            return this.words.filter(word => {
                return word[2] === 'unknown';
            }).length;
        };
        this.getLearn = function () {
            return this.words.filter(word => {
                return word[2] === 'learn';
            }).length;
        };
        this.getKnown = function () {
            return this.words.filter(word => {
                return word[2] === 'known';
            }).length;
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
            console.log(this.pareto);
        };

        if (text) {
            // TODO: по фразам можно показывать контекст слова
            // this.phrases = text.split(/[.!?]/).filter(phrase => {
            //     return phrase.length > 0;
            // });

            let words = text.split(/(\s+)/)
            .map(word => word.toLowerCase().replace(/^\W+/, '').replace(/\W+$/, '').replace(/^[0-9.,]+$/, ''))
            .filter(word => word.length > 0);

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

    /**
     * loadDicts & loadBooks - загрузка базовых структур из хранилища
     */
    function loadDicts() {
        return JSON.parse(localStorage.getItem('dicts'));
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

    export default {
        name: 'Dashboard',
        data() {
            return {
                books: loadBooks() || [],

                dicts: loadDicts() || {
                    unknown: new Dictionary([], 'unknown', 'danger', 'Что не знаю'),
                    learn: new Dictionary([], 'learn', 'warning', 'Что изучить'),
                    known: new Dictionary([], 'known', 'success', 'Что знаю'),
                    stopword: new Dictionary(getStopWords(), 'stopwords', 'info', 'Частовстречаемые общие слова'),
                },

                loading: false,

                textFile: null, // File object
                text: null,
                newBook: null,
            }
        },
        mounted() {
            /**
             * обрабатываем перенос слова из одного словаря в другой
             */
            this.$root.$on('toggleStateWord', data => {

                // перемещаем слово в новый словарь
                this.dicts[data.oldState].words = this.dicts[data.oldState].words.filter(word => {
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
            /**
             * При загрузке файла подготавливаем информацию по предварительному анализу тектса
             */
            textFile() {
                this.loading = true;

                if (this.textFile) {
                    let reader = new FileReader();
                    reader.onload = () => {
                        this.text = reader.result;
                        this.newBook = new Book(this.text, this.textFile.name);

                        // фильтруем стоп-слова
                        let countStopword = 0;
                        this.newBook.words = this.newBook.words.filter((word) => {
                            if (this.dicts.stopword.words.includes(word[0])) {
                                countStopword++;
                                return false;
                            }
                            return true;
                        });

                        // считаем pareto - слова, занимающие 80% объёма
                        this.newBook.calcPareto();

                        // находим слова, которые уже есть в словарях и проставляем им type
                        let counters = {
                            new: 0,
                            unknown: 0,
                            learn: 0,
                            known: 0,
                            stopword: countStopword
                        };
                        for (let i = 0; i < this.newBook.words.length; i++) {
                            let word = this.newBook.words[i][0];

                            // временный тип 'new', при добавлении будет заменён на unknown
                            let type = 'new';
                            if (this.dicts.unknown.words.includes(word)) {
                                type = 'unknown';
                                counters.unknown++;
                            }
                            if (this.dicts.learn.words.includes(word)) {
                                type = 'learn';
                                counters.learn++;
                            }
                            if (this.dicts.known.words.includes(word)) {
                                type = 'known';
                                counters.known++;
                            }
                            if (type === 'new') {
                                counters.new++;
                            }
                            this.newBook.words[i][2] = type;
                            this.newBook.counters = counters;
                        }

                        this.loading = false;
                    };
                    reader.readAsText(this.textFile);
                }
            },
        },
        methods: {
            addBook(event) {
                let checkExist = this.books.filter((item) => {
                    return item.title === this.newBook.title;
                });
                if (checkExist.length > 0) {
                    alert('Уже есть книга с таким именем!');
                    return;
                }

                this.books.push(this.newBook);

                // раскидываем слова по словарям в соответствии с их типами
                for (let i = 0; i < this.newBook.words.length; i++) {
                    let wordInfo = this.newBook.words[i];
                    let word = wordInfo[0];
                    let type = wordInfo[2];

                    if (type === 'new') {
                        type = 'unknown';
                    }

                    // добавляем в словарь, если слова там ещё нет
                    if (!this.dicts[type].words.includes(word)) {
                        this.dicts[type].words.push(word);
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

            /**
             * Сохраняем состояние в localStorage
             */
            saveBooksAndDicts() {
                var booksSerialized = [];
                for (var i = 0; i < this.books.length; i++) {
                    booksSerialized.push({
                        // phrases:        books[i].phrases,
                        totalWordCount: this.books[i].totalWordCount,
                        words: this.books[i].words,
                        pareto: this.books[i].pareto,
                        paretoLimit: this.books[i].paretoLimit,
                        title: this.books[i].title,
                        description: this.books[i].description,
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

    /**
     * Стоп-слова - общие слова, которые мы не хотим учитывать.
     * Это специальные части речи, а также всё, что короче 4 букв
     */
    function getStopWords() {
        return [
            // articles
            'a', 'an', 'the',
            // pronouns
            'all', 'another', 'any', 'anybody', 'anyone', 'anything', 'both',
            'each', 'either', 'everybody', 'everyone', 'everything',
            'few', 'he', 'her', 'hers', 'herself', 'him', 'himself', 'his',
            'i', 'it', 'its', 'itself', 'many', 'me', 'mine', 'more', 'most', 'much', 'my', 'myself',
            'neither', 'nobody', 'none', 'nothingone', 'other', 'others', 'our', 'ours',
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
            'unless', 'now', 'except',
            // other (< 4 letters)
            'aa', 'ab', 'ad', 'ae', 'ag', 'ah', 'ai', 'al', 'am', 'an', 'ar', 'as', 'at', 'aw', 'ax', 'ay', 'ba',
            'be', 'bi', 'bo', 'by', 'da', 'de', 'di', 'do', 'ed', 'ef', 'eh', 'el', 'em', 'en', 'er', 'es', 'et',
            'ew', 'ex', 'fa', 'fe', 'fi', 'gi', 'go', 'ha', 'he', 'hi', 'hm', 'ho', 'id', 'if', 'in', 'is', 'it',
            'jo', 'ka', 'ki', 'la', 'li', 'lo', 'ma', 'me', 'mi', 'mm', 'mo', 'mu', 'my', 'na', 'ne', 'no', 'nu',
            'od', 'oe', 'of', 'oh', 'oi', 'ok', 'om', 'on', 'op', 'or', 'os', 'ow', 'ox', 'oy', 'pa', 'pe', 'pi',
            'po', 'qi', 're', 'sh', 'si', 'so', 'ta', 'te', 'ti', 'to', 'uh', 'um', 'un', 'up', 'us', 'ut', 'we',
            'wo', 'xi', 'xu', 'ya', 'ye', 'yo', 'za',
            'aah', 'aal', 'aas', 'aba', 'abo', 'abs', 'aby', 'ace', 'act', 'add', 'ado', 'ads', 'adz', 'aff', 'aft',
            'aga', 'age', 'ago', 'ags', 'aha', 'ahi', 'ahs', 'aid', 'ail', 'aim', 'ain', 'air', 'ais', 'ait', 'aji',
            'ala', 'alb', 'ale', 'all', 'alp', 'als', 'alt', 'ama', 'ami', 'amp', 'amu', 'ana', 'and', 'ane', 'ani',
            'ant', 'any', 'ape', 'apo', 'app', 'apt', 'arb', 'arc', 'are', 'arf', 'ark', 'arm', 'ars', 'art', 'ash',
            'ask', 'asp', 'ass', 'ate', 'att', 'auk', 'ava', 'ave', 'avo', 'awa', 'awe', 'awl', 'awn', 'axe', 'aye',
            'ays', 'azo', 'baa', 'bad', 'bae', 'bag', 'bah', 'bal', 'bam', 'ban', 'bap', 'bar', 'bas', 'bat', 'bay',
            'bed', 'bee', 'beg', 'bel', 'ben', 'bes', 'bet', 'bey', 'bff', 'bib', 'bid', 'big', 'bin', 'bio', 'bis',
            'bit', 'biz', 'boa', 'bob', 'bod', 'bog', 'boo', 'bop', 'bos', 'bot', 'bow', 'box', 'boy', 'bra', 'bro',
            'brr', 'bub', 'bud', 'bug', 'bum', 'bun', 'bur', 'bus', 'but', 'buy', 'bye', 'bys', 'cab', 'cad', 'caf',
            'cal', 'cam', 'can', 'cap', 'car', 'cat', 'caw', 'cay', 'cee', 'cel', 'cep', 'chi', 'cig', 'cis', 'cob',
            'cod', 'cog', 'col', 'con', 'coo', 'cop', 'cor', 'cos', 'cot', 'cow', 'cox', 'coy', 'coz', 'cru', 'cry',
            'cub', 'cud', 'cue', 'cum', 'cup', 'cur', 'cut', 'cuz', 'cwm', 'dab', 'dad', 'dag', 'dah', 'dak', 'dal',
            'dam', 'dan', 'dap', 'das', 'daw', 'day', 'deb', 'dee', 'def', 'del', 'den', 'dep', 'dev', 'dew', 'dex',
            'dey', 'dib', 'did', 'die', 'dif', 'dig', 'dim', 'din', 'dip', 'dis', 'dit', 'doc', 'doe', 'dog', 'doh',
            'dol', 'dom', 'don', 'dor', 'dos', 'dot', 'dow', 'dry', 'dub', 'dud', 'due', 'dug', 'duh', 'dui', 'dum',
            'dun', 'duo', 'dup', 'dux', 'dye', 'ear', 'eat', 'eau', 'ebb', 'eco', 'ecu', 'edh', 'eds', 'eek', 'eel',
            'eew', 'eff', 'efs', 'eft', 'egg', 'ego', 'eke', 'eld', 'elf', 'elk', 'ell', 'elm', 'els', 'eme', 'emf',
            'emo', 'ems', 'emu', 'end', 'eng', 'ens', 'eon', 'era', 'ere', 'erg', 'ern', 'err', 'ers', 'ess', 'est',
            'eta', 'eth', 'eve', 'ewe', 'eye', 'fab', 'fad', 'fag', 'fah', 'fan', 'far', 'fas', 'fat', 'fax', 'fay',
            'fed', 'fee', 'feh', 'fem', 'fen', 'fer', 'fes', 'fet', 'feu', 'few', 'fey', 'fez', 'fib', 'fid', 'fie',
            'fig', 'fil', 'fin', 'fir', 'fit', 'fix', 'fiz', 'flu', 'fly', 'fob', 'foe', 'fog', 'foh', 'fon', 'foo',
            'fop', 'for', 'fou', 'fox', 'foy', 'fro', 'fry', 'fub', 'fud', 'fug', 'fun', 'fur', 'gab', 'gad', 'gae',
            'gag', 'gal', 'gam', 'gan', 'gap', 'gar', 'gas', 'gat', 'gay', 'ged', 'gee', 'gel', 'gem', 'gen', 'get',
            'gey', 'ghi', 'gib', 'gid', 'gie', 'gif', 'gig', 'gin', 'gip', 'gis', 'git', 'gnu', 'goa', 'gob', 'god',
            'goo', 'gor', 'gos', 'got', 'gox', 'goy', 'grr', 'gul', 'gum', 'gun', 'gut', 'guv', 'guy', 'gym', 'gyp',
            'had', 'hae', 'hag', 'hah', 'haj', 'ham', 'hao', 'hap', 'has', 'hat', 'haw', 'hay', 'heh', 'hem', 'hen',
            'hep', 'her', 'hes', 'het', 'hew', 'hex', 'hey', 'hic', 'hid', 'hie', 'him', 'hin', 'hip', 'his', 'hit',
            'hmm', 'hob', 'hod', 'hoe', 'hog', 'hom', 'hon', 'hoo', 'hop', 'hos', 'hot', 'how', 'hoy', 'hub', 'hue',
            'hug', 'huh', 'hum', 'hun', 'hup', 'hut', 'hyp', 'ice', 'ich', 'ick', 'icy', 'ids', 'iff', 'ifs', 'igg',
            'ilk', 'ill', 'imp', 'ink', 'inn', 'ins', 'ion', 'ire', 'irk', 'ism', 'its', 'ivy', 'jab', 'jag', 'jam',
            'jar', 'jaw', 'jay', 'jee', 'jet', 'jeu', 'jew', 'jib', 'jig', 'jin', 'job', 'joe', 'jog', 'jot', 'jow',
            'joy', 'jug', 'jun', 'jus', 'jut', 'kab', 'kae', 'kaf', 'kas', 'kat', 'kay', 'kea', 'ked', 'kef', 'keg',
            'ken', 'kep', 'kex', 'key', 'khi', 'kid', 'kif', 'kin', 'kip', 'kir', 'kis', 'kit', 'koa', 'kob', 'koi',
            'kop', 'kor', 'kos', 'kue', 'kye', 'lab', 'lac', 'lad', 'lag', 'lah', 'lam', 'lap', 'lar', 'las', 'lat',
            'lav', 'law', 'lax', 'lay', 'lea', 'led', 'lee', 'leg', 'lei', 'lek', 'les', 'let', 'leu', 'lev', 'lex',
            'ley', 'lez', 'lib', 'lid', 'lie', 'lin', 'lip', 'lis', 'lit', 'lob', 'log', 'loo', 'lop', 'lor', 'lot',
            'low', 'lox', 'lud', 'lug', 'lum', 'lun', 'luv', 'lux', 'lye', 'mac', 'mad', 'mae', 'mag', 'mam', 'man',
            'map', 'mar', 'mas', 'mat', 'maw', 'max', 'may', 'med', 'meg', 'meh', 'mel', 'mem', 'men', 'mes', 'met',
            'mew', 'mho', 'mib', 'mic', 'mid', 'mig', 'mil', 'mim', 'mir', 'mis', 'mix', 'mmm', 'moa', 'mob', 'moc',
            'mod', 'mog', 'moi', 'mol', 'mom', 'mon', 'moo', 'mop', 'mor', 'mos', 'mot', 'mow', 'mud', 'mug', 'mum',
            'mun', 'mus', 'mut', 'mux', 'myc', 'nab', 'nae', 'nag', 'nah', 'nam', 'nan', 'nap', 'nav', 'naw', 'nay',
            'neb', 'nee', 'neg', 'net', 'new', 'nib', 'nil', 'nim', 'nip', 'nit', 'nix', 'nob', 'nod', 'nog', 'noh',
            'nom', 'noo', 'nor', 'nos', 'not', 'now', 'nth', 'nub', 'nug', 'nun', 'nus', 'nut', 'oaf', 'oak', 'oar',
            'oat', 'oba', 'obe', 'obi', 'oca', 'och', 'oda', 'odd', 'ode', 'ods', 'oes', 'off', 'oft', 'ohm', 'oho',
            'ohs', 'oik', 'oil', 'oka', 'oke', 'old', 'ole', 'oma', 'oms', 'one', 'ono', 'ons', 'oof', 'ooh', 'oot',
            'opa', 'ope', 'ops', 'opt', 'ora', 'orb', 'orc', 'ore', 'org', 'ors', 'ort', 'ose', 'oud', 'our', 'out',
            'ova', 'owe', 'owl', 'own', 'owt', 'oxo', 'oxy', 'pac', 'pad', 'pah', 'pak', 'pal', 'pam', 'pan', 'pap',
            'par', 'pas', 'pat', 'paw', 'pax', 'pay', 'pea', 'pec', 'ped', 'pee', 'peg', 'peh', 'pen', 'pep', 'per',
            'pes', 'pet', 'pew', 'phi', 'pho', 'pht', 'pia', 'pic', 'pie', 'pig', 'pin', 'pip', 'pis', 'pit', 'piu',
            'pix', 'ply', 'pod', 'poh', 'poi', 'pol', 'pom', 'poo', 'pop', 'pos', 'pot', 'pow', 'pox', 'pro', 'pry',
            'psi', 'pst', 'pub', 'pud', 'pug', 'pul', 'pun', 'pup', 'pur', 'pus', 'put', 'pya', 'pye', 'pyx', 'qat',
            'qis', 'qua', 'quo', 'rad', 'rag', 'rah', 'rai', 'raj', 'ram', 'ran', 'rap', 'ras', 'rat', 'raw', 'rax',
            'ray', 'reb', 'rec', 'red', 'ree', 'ref', 'reg', 'rei', 'rem', 'rep', 'res', 'ret', 'rev', 'rex', 'rez',
            'rho', 'ria', 'rib', 'rid', 'rif', 'rig', 'rim', 'rin', 'rip', 'rob', 'roc', 'rod', 'roe', 'rom', 'roo',
            'rot', 'row', 'rub', 'rue', 'rug', 'rum', 'run', 'rut', 'rya', 'rye', 'ryu', 'sab', 'sac', 'sad', 'sae',
            'sag', 'sal', 'san', 'sap', 'sat', 'sau', 'saw', 'sax', 'say', 'sea', 'sec', 'see', 'seg', 'sei', 'sel',
            'sen', 'ser', 'set', 'sev', 'sew', 'sex', 'sez', 'sha', 'she', 'shh', 'sho', 'shy', 'sib', 'sic', 'sig',
            'sim', 'sin', 'sip', 'sir', 'sis', 'sit', 'six', 'ska', 'ski', 'sky', 'sly', 'sob', 'soc', 'sod', 'soh',
            'sol', 'som', 'son', 'sop', 'sos', 'sot', 'sou', 'sow', 'sox', 'soy', 'spa', 'spy', 'sri', 'sty', 'sub',
            'sue', 'suk', 'sum', 'sun', 'sup', 'suq', 'sus', 'syn', 'tab', 'tad', 'tae', 'tag', 'taj', 'tam', 'tan',
            'tao', 'tap', 'tar', 'tas', 'tat', 'tau', 'tav', 'taw', 'tax', 'tea', 'tec', 'ted', 'tee', 'teg', 'tel',
            'ten', 'tes', 'tet', 'tew', 'tfw', 'the', 'tho', 'thy', 'tic', 'tie', 'til', 'tin', 'tip', 'tis', 'tit',
            'tix', 'tiz', 'tod', 'toe', 'tog', 'tom', 'ton', 'too', 'top', 'tor', 'tot', 'tow', 'toy', 'try', 'tsk',
            'tub', 'tug', 'tui', 'tum', 'tun', 'tup', 'tut', 'tux', 'twa', 'two', 'tye', 'udo', 'ugh', 'uke', 'ulu',
            'umm', 'ump', 'ums', 'uni', 'uns', 'upo', 'ups', 'urb', 'urd', 'urn', 'urp', 'use', 'uta', 'ute', 'uts',
            'vac', 'van', 'var', 'vas', 'vat', 'vau', 'vav', 'vaw', 'vee', 'veg', 'vet', 'vex', 'via', 'vid', 'vie',
            'vig', 'vim', 'vin', 'vis', 'voe', 'vog', 'von', 'vow', 'vox', 'vug', 'vum', 'wab', 'wad', 'wae', 'wag',
            'wan', 'wap', 'war', 'was', 'wat', 'waw', 'wax', 'way', 'web', 'wed', 'wee', 'wen', 'wet', 'wha', 'who',
            'why', 'wig', 'win', 'wis', 'wit', 'wiz', 'woe', 'wog', 'wok', 'won', 'woo', 'wop', 'wos', 'wot', 'wow',
            'wry', 'wud', 'wuz', 'wye', 'wyn', 'xed', 'xis', 'yag', 'yah', 'yak', 'yam', 'yap', 'yar', 'yas', 'yaw',
            'yay', 'yea', 'yeh', 'yen', 'yep', 'yer', 'yes', 'yet', 'yew', 'yez', 'yid', 'yin', 'yip', 'yob', 'yod',
            'yok', 'yom', 'yon', 'you', 'yow', 'yuk', 'yum', 'yup', 'zag', 'zap', 'zas', 'zax', 'zed', 'zee', 'zek',
            'zen', 'zep', 'zig', 'zin', 'zip', 'zit', 'zoa', 'zoo', 'zuz', 'zzz'
        ];
    }
</script>

<style>
    .lds-dual-ring {
        display: inline-block;
        width: 64px;
        height: 64px;

        position: absolute;
        top: 50%;
        left: 50%;
        z-index: 15;
        margin: -32px 0 0 -32px;
    }
    .lds-dual-ring:after {
        content: " ";
        display: block;
        width: 46px;
        height: 46px;
        margin: 1px;
        border-radius: 50%;
        border: 5px solid;
        border-color: #000 transparent #000 transparent;
        animation: lds-dual-ring 1.2s linear infinite;
    }
    @keyframes lds-dual-ring {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>