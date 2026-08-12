<script setup>
import Modal from '../common/Modal.vue'
import Button from "@/components/common/Button.vue";
import InputText from "@/components/common/InputText.vue";
import Radio from "@/components/common/Radio.vue";
import ModeSwitch from "@/components/common/ModeSwitch.vue";
</script>

<template>
  <div>
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-sm font-semibold text-gray-700">
        Тренировка: {{ isPhraseMode ? 'фразы' : 'слова' }}
      </h2>
      <ModeSwitch />
    </div>

    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div class="rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500">В очереди</div>
        <div class="text-2xl font-semibold">{{ wordsInQueue }}</div>
      </div>
      <div class="rounded-lg border border-gray-200 p-3">
        <div class="text-xs text-gray-500">Повторить сегодня</div>
        <div class="text-2xl font-semibold">{{ forLessonCount }}</div>
      </div>
      <div class="col-span-2 rounded-lg border border-gray-200 p-3 sm:col-span-1">
        <div class="mb-1 text-xs text-gray-500">По уровням</div>
        <div class="flex flex-wrap gap-1">
          <span
              v-for="(count, i) in wordsInLearn"
              :key="i"
              class="rounded-sm bg-gray-100 px-2 py-0.5 text-sm"
              :title="`Уровень ${i + 1}`"
          >{{ count }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <Button
          text="добавить перевод"
          color="cyan"
          @click="openLearnModal"
      />
      <Button
          text="начать повторение"
          color="green"
          :disabled="!forLessonCount"
          :title="forLessonCount ? undefined : 'На сегодня повторять нечего'"
          @click="start"
      />
    </div>

    <p v-if="skippedNote" class="mt-3 text-sm text-amber-700">{{ skippedNote }}</p>

    <Modal
        :isOpen="isOpenAddModal"
        @close="isOpenAddModal = false"
        @accept="acceptToLearn"
        :title="isPhraseMode ? 'Добавление фраз на изучение' : 'Добавление слов на изучение'"
    >
      <p v-if="!Object.keys(forTranslate ?? {}).length" class="text-sm text-gray-500">
        {{ isPhraseMode
            ? 'Нет новых фраз — выделите фразу прямо в тексте в разделе «Чтение».'
            : 'Нет новых слов — добавьте текст в разделе «Чтение».' }}
      </p>

      <div
          v-for="(translate, word) in forTranslate"
          :key="word"
          class="mb-2 grid grid-cols-3 items-center gap-2"
      >
        <div class="col-span-1 break-words">{{ word }}</div>
        <div class="col-span-2">
          <InputText v-model="forTranslate[word]"/>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <Button
            :text="translating ? `переводим ${progress.done}/${progress.total}…` : 'перевести автоматически'"
            :disabled="translating || !untranslated.length"
            :title="untranslated.length ? `Заполнит пустые поля: ${untranslated.length}` : 'Все поля заполнены'"
            @click="autoTranslate"
        />
        <span v-if="translateError" class="text-sm text-red-600">{{ translateError }}</span>
      </div>
    </Modal>

    <Modal
        :isOpen="isOpenLessonModal"
        @close="isOpenLessonModal = false"
        @accept="finish"
        :title="getTitle"
    >
      <div class="text-lg font-medium text-gray-900">{{ question }}</div>
      <Radio
          :items="items"
          v-model="select"
          @select="checkSelect"
      />
    </Modal>
  </div>
</template>

<script>
import {mapActions, mapState} from "pinia";
import {PHRASE, useWordsStore} from "@/stores/words";

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

export default {
  data() {
    return {
      isOpenAddModal: false,
      isOpenLessonModal: false,
      translating: false,
      translateError: null,
      skippedNote: null,
      progress: { done: 0, total: 0 },
      batchCount: 10,
      forTranslate: null,
      forLesson: null,

      pool: [],
      question: null,
      answer: null,
      select: null,
      items: [],
      answers: {},
    }
  },
  computed: {
    ...mapState(useWordsStore, ['getInterval', 'getMaxLevel', 'getForLesson', 'getLearnMode']),
    isPhraseMode() {
      return this.getLearnMode === PHRASE
    },
    forLessonCount() {
      return Object.keys(this.getForLesson).length
    },
    /** поля, которые ещё не заполнены — только их и переводим */
    untranslated() {
      return Object.entries(this.forTranslate ?? {})
          .filter(([, ru]) => !String(ru ?? '').trim())
          .map(([key]) => key)
    },
    wordsInQueue() {
      return Object.keys(this.getInterval(0)).length
    },
    wordsInLearn() {
      let tmp = []
      for (let i = 1; i <= this.getMaxLevel; i++) {
        tmp.push(Object.keys(this.getInterval(i)).length)
      }
      return tmp
    },
    getTitle() {
      const what = this.isPhraseMode ? 'фразы' : 'слова'
      return `Выбери перевод ${what} (${Object.keys(this.answers).length + 1}/${this.pool.length})`;
    },
  },
  watch: {
    // урок, начатый на словах, нельзя досохранять в пул фраз
    getLearnMode() {
      this.isOpenAddModal = false
      this.isOpenLessonModal = false
      this.forTranslate = null
      this.answers = {}
      this.pool = []
      this.translateError = null
      this.skippedNote = null
    },
  },
  methods: {
    ...mapActions(useWordsStore, ['getForLearn', 'toLearn', 'translate', 'saveLesson']),
    openLearnModal() {
      // окно открывается заново — итоги прошлого перевода к нему не относятся
      this.skippedNote = null
      this.translateError = null
      this.progress = { done: 0, total: 0 }

      this.isOpenAddModal = true
      let data = this.getForLearn(this.batchCount)
      this.forTranslate = data.reduce((o, key) => ({ ...o, [key]: null}), {})
    },
    async autoTranslate() {
      // уже введённое рукой не трогаем — перевод модели его бы затёр
      const keys = this.untranslated
      if (!keys.length) {
        return
      }

      this.translating = true
      this.translateError = null
      this.progress = { done: 0, total: keys.length }

      const results = await this.translate(keys, {
        onProgress: (done, total) => this.progress = { done, total },
      })

      // null означает, что конкретно это слово не перевелось — уже введённое не затираем
      results.forEach((value, i) => {
        if (value) {
          this.forTranslate[keys[i]] = value
        }
      })

      const failed = results.filter(value => !value).length
      if (failed === keys.length) {
        this.translateError = 'Локальная модель недоступна'
      } else if (failed) {
        this.translateError = `Не перевелось: ${failed}`
      }

      this.translating = false
    },
    acceptToLearn() {
      const untranslated = Object.values(this.forTranslate ?? {})
          .filter(ru => !String(ru ?? '').trim()).length

      this.isOpenAddModal = false
      this.toLearn(this.forTranslate)

      // без перевода на изучение не берём — предупреждаем, чтобы не выглядело пропажей
      this.skippedNote = untranslated
          ? `Без перевода: ${untranslated}. Остались в очереди.`
          : null
    },


    start() {
      // без этой проверки урок открылся бы и тут же сам себя закрыл
      if (!this.forLessonCount) {
        return
      }
      // прошлый урок могли закрыть на «Отменить» — начинаем с чистого листа
      this.select = null
      this.answers = {}

      this.forLesson = JSON.parse(JSON.stringify(this.getForLesson))
      this.isOpenLessonModal = true
      this.pool = Object.values(this.forLesson).map(x => x.ru)
      this.prepareQuestion()
    },
    prepareQuestion() {
      const key = Object.keys(this.forLesson)[0] ?? null
      if (key) {
        const translate = this.forLesson[key].ru
        delete this.forLesson[key]

        // разные слова нередко переводятся одинаково («дать» у give/gave/giving),
        // поэтому отвлекающие варианты берём из различных переводов: иначе в вопросе
        // окажется несколько одинаковых кнопок вместо четырёх разных
        const distractors = [...new Set(this.pool)].filter(x => x && x !== translate)
        let cases = shuffle(distractors).slice(0, 3)
        cases = shuffle([...cases, translate])

        this.question = key
        this.answer = translate
        this.items = cases
      } else {
        this.finish()
      }
    },
    checkSelect() {
      this.answers[this.question] = this.answer === this.select
      this.select = null
      this.items = []
      this.prepareQuestion()
    },
    finish() {
      this.isOpenLessonModal = false
      this.saveLesson(this.answers)
      this.answers = {}
      this.pool = []
    },
  }
}
</script>
