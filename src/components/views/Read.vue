<template>
  <!-- выбор текста -->
  <div v-if="!dict">
    <!-- добавление нового текста -->
    <section class="mb-8">
      <h2 class="mb-2 text-sm font-semibold text-gray-700">Добавить текст</h2>

      <DictInfo
          v-if="pendingText"
          :text="pendingText"
          :name="pendingName"
          @close="clearPending"
      />
      <InputFile
          v-else
          @load="loadFile"
      />
    </section>

    <h2 class="mb-2 text-sm font-semibold text-gray-700">Мои тексты</h2>

    <p v-if="!getDicts.length" class="text-gray-500">
      Пока нечего читать — загрузите текстовый файл на {{ getLanguageConfig.name }}.
    </p>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button
          v-for="item in getDicts"
          :key="item.id"
          type="button"
          class="rounded-lg border border-gray-300 p-4 text-left transition hover:border-sky-400 hover:bg-sky-50 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          @click="open(item.id)"
      >
        <div class="mb-1 flex items-baseline gap-2">
          <span class="min-w-0 truncate font-semibold">{{ item.name || 'Без названия' }}</span>
          <span
              v-if="item.builtin"
              class="shrink-0 rounded-sm bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500"
              title="Входит в приложение, удалить нельзя"
          >встроенный</span>
        </div>
        <div v-if="item.description" class="mb-2 truncate text-xs text-gray-500">
          {{ item.description }}
        </div>
        <p class="mb-3 line-clamp-3 text-sm text-gray-600">{{ item.text }}</p>

        <div class="flex items-center gap-2">
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div class="h-full rounded-full bg-sky-500" :style="{ width: percent(item.id) + '%' }" />
          </div>
          <span class="shrink-0 text-xs text-gray-500">{{ percent(item.id) }}%</span>
        </div>
      </button>
    </div>
  </div>

  <!-- читалка -->
  <div v-else>
    <!-- прилипает под шапкой: h-12 навбара + компенсация py-6 у main -->
    <div class="sticky top-12 z-20 -mt-6 mb-3 flex items-center gap-2 border-b border-gray-200 bg-white py-3">
      <button
          type="button"
          class="shrink-0 rounded-md p-2 text-gray-500 hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          aria-label="К списку текстов"
          @click="close"
      >
        <ArrowLeftIcon class="h-5 w-5" />
      </button>

      <!-- на узких экранах название уступает место переключателю режима -->
      <h2 class="hidden min-w-0 flex-1 truncate font-semibold sm:block">{{ dict.name || 'Без названия' }}</h2>

      <div class="min-w-0 flex-1 sm:flex-none">
        <ModeSwitch />
      </div>

      <!-- листалка здесь же: под текстом ничего не остаётся -->
      <div class="flex shrink-0 items-center gap-1">
        <button
            type="button"
            class="rounded-md p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            aria-label="Предыдущая страница"
            :disabled="page === 0"
            @click="turn(-1)"
        >
          <ChevronLeftIcon class="h-5 w-5" />
        </button>

        <span class="min-w-14 text-center text-xs tabular-nums text-gray-500">
          {{ page + 1 }} / {{ pages.length }}
        </span>

        <button
            type="button"
            class="rounded-md p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            aria-label="Следующая страница"
            :disabled="page >= pages.length - 1"
            @click="turn(1)"
        >
          <ChevronRightIcon class="h-5 w-5" />
        </button>
      </div>
    </div>

    <article
        class="mx-auto max-w-2xl leading-relaxed"
        :style="{ fontSize: getFontSize + 'px' }"
    >
      <p v-for="(block, i) in pageContent" :key="i" class="mb-4">
        <!-- режим фраз: кликается предложение целиком -->
        <template v-if="isPhraseMode">
          <span
              v-for="sentence in block.sentences"
              :key="sentence.index"
              :class="['cursor-pointer rounded-sm', sentenceClass(i, sentence)]"
              @click.stop="pickSentence(i, sentence, $event)"
          ><template v-for="(token, j) in sentence.tokens" :key="j"><span
              v-if="token.phrase"
              class="rounded-sm bg-amber-100 px-px"
          >{{ token.text }}</span><template v-else>{{ token.text }}</template></template></span>
        </template>

        <!-- режим слов: кликается отдельное слово -->
        <template v-else>
          <template v-for="(token, j) in block.tokens" :key="j">
            <span
                v-if="token.word"
                :class="['cursor-pointer rounded-sm px-px', tokenClass(token)]"
                @click.stop="pick(token, $event)"
            >{{ token.text }}</span>
            <template v-else>{{ token.text }}</template>
          </template>
        </template>
      </p>

    </article>


    <!-- карточка предложения -->
    <div
        v-if="active && active.kind === SENTENCE"
        class="fixed z-50 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
        :style="popover"
        @click.stop
    >
      <div class="mb-2 line-clamp-3 text-xs text-gray-400 break-words">{{ active.key }}</div>

      <div class="text-sm break-words">
        <span v-if="active.translation" class="text-gray-800">{{ active.translation }}</span>
        <span v-else-if="translating" class="text-gray-400">перевод…</span>
        <span v-else-if="translateError" class="text-red-600">{{ translateError }}</span>
        <span v-else class="text-gray-400">перевода нет</span>
      </div>

      <div v-if="active.phrases.length" class="mt-3 border-t border-gray-200 pt-2">
        <div class="mb-1 text-xs font-medium text-gray-500">Фразы из словаря</div>
        <dl class="space-y-1">
          <div v-for="phrase in active.phrases" :key="phrase.key" class="text-sm break-words">
            <dt class="inline font-medium">{{ phrase.key }}</dt>
            <dd class="inline text-gray-600"> — {{ phrase.ru || 'без перевода' }}</dd>
          </div>
        </dl>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button
            v-if="!active.translation && !translating"
            type="button"
            class="rounded-md bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
            @click="fetchSentence"
        >Повторить</button>
        <button
            type="button"
            class="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            @click="dismiss"
        >Закрыть</button>
      </div>
    </div>

    <!-- карточка слова или фразы -->
    <div
        v-else-if="active"
        class="fixed z-50 w-60 rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
        :style="popover"
        @click.stop
    >
      <div class="mb-1 font-semibold break-words">{{ active.key }}</div>

      <div class="mb-3 text-sm break-words">
        <span v-if="active.translation" class="text-gray-600">{{ active.translation }}</span>
        <span v-else-if="translating" class="text-gray-400">перевод…</span>
        <span v-else-if="translateError" class="text-red-600">{{ translateError }}</span>
        <span v-else class="text-gray-400">перевода пока нет</span>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
            v-if="!active.translation"
            type="button"
            class="rounded-md bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 disabled:opacity-40"
            :disabled="translating"
            @click="fetchTranslation"
        >Перевести</button>

        <button
            v-if="active.kind === PHRASE && active.status === 'unknown'"
            type="button"
            class="rounded-md bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
            @click="savePhrase"
        >Сохранить фразу</button>

        <button
            v-if="active.status === 'queue'"
            type="button"
            class="rounded-md bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700 disabled:opacity-40"
            :disabled="!active.translation"
            @click="addToLearn"
        >В изучение</button>

        <button
            type="button"
            class="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
            @click="dismiss"
        >Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { mapActions, mapState } from 'pinia'
import { PHRASE, useWordsStore, WORD } from '@/stores/words'
import {
  buildPhraseIndex,
  countSequence,
  markPhrases,
  paginate,
  phraseFromSelection,
  sentencePhrases,
  splitSentences,
  tokenize,
} from '@/domain/reader'
import { SENTENCE_TIMEOUT, WORD_TIMEOUT } from '@/domain/translator'
import DictInfo from '@/components/DictInfo.vue'
import InputFile from '@/components/common/InputFile.vue'
import ModeSwitch from '@/components/common/ModeSwitch.vue'

/** вид карточки: предложение — это не запись словаря, у него нет уровня изучения */
const SENTENCE = 'sentence'

export default {
  name: 'Read',
  components: { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, DictInfo, InputFile, ModeSwitch },
  data() {
    return {
      dictId: null,
      page: 0,
      active: null,
      translating: false,
      translateError: null,
      popover: {},
      // какое предложение выделено: { paragraph, index }
      activeSentence: null,
      // переводы предложений за сессию; в localStorage не кладём — раздует хранилище
      sentenceCache: {},
      // загруженный, но ещё не сохранённый текст: ждём название и описание
      pendingText: null,
      pendingName: null,
    }
  },
  computed: {
    ...mapState(useWordsStore, [
      'getDicts',
      'getDictById',
      'getReading',
      'getWordPool',
      'getPhrasePool',
      'getPhraseArchive',
      'getWordStatus',
      'getPhraseStatus',
      'getTranslation',
      'getLearnMode',
      'getLanguageConfig',
      'getLanguageCode',
      'getFontSize',
    ]),
    dict() {
      return this.dictId ? this.getDictById(this.dictId) : null
    },
    pages() {
      return this.dict ? paginate(this.dict.text) : [[]]
    },
    wordPattern() {
      return this.getLanguageConfig.wordPattern
    },
    isPhraseMode() {
      return this.getLearnMode === PHRASE
    },
    SENTENCE: () => SENTENCE,
    PHRASE: () => PHRASE,
    phraseIndex() {
      // фразы из архива тоже подсвечиваем: выучил — не значит «забудь»
      return buildPhraseIndex([
        ...Object.keys(this.getPhrasePool),
        ...Object.keys(this.getPhraseArchive),
      ])
    },
    /** абзацы страницы: плоские токены для режима слов, предложения — для режима фраз */
    pageContent() {
      const pattern = this.wordPattern

      return this.pages[this.page].map(paragraph => {
        const tokens = markPhrases(tokenize(paragraph, pattern), this.phraseIndex)
        return { tokens, sentences: splitSentences(tokens) }
      })
    },
  },
  watch: {
    // при смене языка открытый текст относится к другому языку, а недосохранённый
    // разобран старым алфавитом — сбрасываем и то, и другое
    getLanguageCode() {
      this.close()
      this.clearPending()
    },
    getLearnMode() {
      this.dismiss()
    },
  },
  mounted() {
    document.addEventListener('click', this.dismiss)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.dismiss)
  },
  methods: {
    ...mapActions(useWordsStore, [
      'toLearn',
      'translate',
      'setTranslation',
      'setReadingProgress',
      'addPhrase',
    ]),

    loadFile(text, name) {
      this.pendingText = text
      this.pendingName = name
    },
    clearPending() {
      this.pendingText = null
      this.pendingName = null
    },

    percent(id) {
      return Math.round((this.getReading[id] ?? 0) * 100)
    },
    open(id) {
      this.dictId = id
      const dict = this.getDictById(id)
      const total = paginate(dict.text).length
      // возвращаемся туда, где остановились
      this.page = Math.min(Math.round((this.getReading[id] ?? 0) * total), total - 1)
      this.dismiss()
    },
    close() {
      this.dictId = null
      this.dismiss()
    },
    turn(delta) {
      this.page = Math.min(Math.max(this.page + delta, 0), this.pages.length - 1)
      this.dismiss()
      this.setReadingProgress(this.dictId, this.page / this.pages.length)
      window.scrollTo({ top: 0 })
    },

    tokenClass(token) {
      return {
        // «новое» — это почти каждое слово добавленного текста, поэтому не заливка,
        // а точечное подчёркивание: иначе страница превращается в сплошной жёлтый фон
        queue: 'underline decoration-amber-400 decoration-dotted underline-offset-4 hover:bg-amber-100',
        learn: 'bg-sky-200/70 hover:bg-sky-300',
        known: 'bg-green-100 hover:bg-green-200',
        unknown: 'hover:bg-gray-200',
      }[this.getWordStatus(token.word)]
    },

    pick(token, event) {
      this.show(token.word, WORD, event.target.getBoundingClientRect())
    },

    sentenceClass(paragraph, sentence) {
      const selected = this.activeSentence
          && this.activeSentence.paragraph === paragraph
          && this.activeSentence.index === sentence.index

      return selected ? 'bg-sky-100' : 'hover:bg-gray-100'
    },

    /**
     * Клик по предложению. Если пользователь протащил выделение — он метил во
     * фразу, а не в предложение: обычный клик схлопывает выделение на mousedown,
     * поэтому непустое выделение здесь означает именно протяжку.
     */
    async pickSentence(paragraph, sentence, event) {
      const selected = window.getSelection()?.toString() ?? ''
      const phrase = phraseFromSelection(selected, this.wordPattern)

      // фразой считаем от двух слов: одно слово — это работа режима «Слова»
      if (phrase.includes(' ')) {
        this.showPhrase(phrase)
        return
      }

      this.activeSentence = { paragraph, index: sentence.index }
      this.translateError = null

      this.position(event.currentTarget.getBoundingClientRect(), 288) // w-72
      this.active = {
        kind: SENTENCE,
        key: sentence.text,
        translation: this.sentenceCache[sentence.text] ?? null,
        phrases: sentencePhrases(sentence).map(key => ({
          key,
          ru: this.getPhrasePool[key]?.ru ?? this.getPhraseArchive[key]?.ru ?? null,
        })),
      }

      if (!this.active.translation) {
        await this.fetchSentence()
      }
    },

    async fetchSentence() {
      const sentence = this.active.key

      this.translating = true
      this.translateError = null

      const [translation] = await this.translate([sentence], { timeout: SENTENCE_TIMEOUT })

      // пока ждали ответ, пользователь мог выбрать другое предложение
      if (this.active?.key !== sentence) {
        return
      }
      this.translating = false

      if (!translation) {
        this.translateError = 'Не удалось перевести'
        return
      }
      this.sentenceCache[sentence] = translation
      this.active = { ...this.active, translation }
    },

    position(rect, width) {
      const gap = 8

      // прижимаем к границам вьюпорта, чтобы карточка не уехала за экран
      const left = Math.min(
          Math.max(rect.left + rect.width / 2 - width / 2, gap),
          window.innerWidth - width - gap
      )
      // не хватает места снизу — показываем над словом
      const below = rect.bottom + gap
      const flip = below + 170 > window.innerHeight

      this.popover = flip
          ? { left: `${left}px`, bottom: `${window.innerHeight - rect.top + gap}px` }
          : { left: `${left}px`, top: `${below}px` }
    },

    show(key, kind, rect) {
      this.position(rect, 240) // w-60
      this.translateError = null
      this.activeSentence = null

      this.active = {
        key,
        kind,
        status: kind === PHRASE ? this.getPhraseStatus(key) : this.getWordStatus(key),
        translation: this.getTranslation(key, kind),
      }
    },

    /** карточка выделенной фразы: якорем служит прямоугольник самого выделения */
    showPhrase(phrase) {
      const range = window.getSelection().getRangeAt(0)
      this.show(phrase, PHRASE, range.getBoundingClientRect())
    },

    dismiss() {
      this.active = null
      this.activeSentence = null
      this.translateError = null
    },

    async fetchTranslation() {
      this.translating = true
      this.translateError = null

      const [translation] = await this.translate([this.active.key], { timeout: WORD_TIMEOUT })
      this.translating = false

      if (!translation) {
        this.translateError = 'Локальная модель недоступна'
        return
      }
      // у ещё не сохранённой фразы нет записи в пуле — перевод положим при сохранении
      if (this.active.status !== 'unknown') {
        this.setTranslation(this.active.key, translation, this.active.kind)
      }
      this.active = { ...this.active, translation }
    },

    /** выделенной фразы ещё нет ни в одном пуле — заводим её */
    savePhrase() {
      const sequence = this.active.key.split(' ')
      this.addPhrase(this.active.key, countSequence(this.dict.words, sequence))

      if (this.active.translation) {
        this.setTranslation(this.active.key, this.active.translation, PHRASE)
      }
      this.active = { ...this.active, status: this.getPhraseStatus(this.active.key) }
    },

    addToLearn() {
      this.toLearn({ [this.active.key]: this.active.translation }, this.active.kind)
      this.active = {
        ...this.active,
        status: this.active.kind === PHRASE
            ? this.getPhraseStatus(this.active.key)
            : this.getWordStatus(this.active.key),
      }
    },
  },
}
</script>
