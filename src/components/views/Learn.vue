<script setup>
import Modal from '../common/Modal.vue'
import Button from "@/components/common/Button.vue";
import InputText from "@/components/common/InputText.vue";
import Radio from "@/components/common/Radio.vue";
</script>

<template>
  <main class="container mx-auto px-4">
    <p>
      В очереди: {{ wordsInQueue }}
    </p>
    <p>
      Обучение: {{ wordsInLearn }}
    </p>
    <p>
      Для повторения сегодня: {{ Object.keys(getForLesson).length }}
    </p>

    <Button
        text="добавить перевод"
        @click="openLearnModal"
    />
    <Modal
        :isOpen="isOpenAddModal"
        @close="isOpenAddModal = false"
        @accept="acceptToLearn"
        title="Добавление слов на изучение"
    >
      <div v-for="(translate, word) in forTranslate">
        <div class="grid grid-cols-3 gap-2">
          <div class="grid content-center col-span-1">{{ word }}</div>
          <div class="grid content-center col-span-2">
            <InputText v-model="forTranslate[word]"/>
          </div>
        </div>
      </div>
      <br>
      <Button
          text="autoTranslate"
          @click="autoTranslate"
      />
    </Modal>


    <Button
        text="начать повторение"
        @click="start"
    />
    <Modal
        :isOpen="isOpenLessonModal"
        @close="isOpenLessonModal = false"
        @accept="finish"
        :title="getTitle"
    >
      {{ question }}
      <Radio
          :items="items"
          v-model="select"
          @select="checkSelect"
      />
    </Modal>


    <Button
        text="+1 день"
        @click="step"
    />
  </main>
</template>

<script>
import {mapActions, mapState} from "pinia";
import {useWordsStore} from "@/stores/words";

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
    ...mapState(useWordsStore, ['getInterval', 'getMaxLevel', 'getForLesson']),
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
      return 'Выбери перевод слова (' + (Object.keys(this.answers).length + 1) + '/' + this.pool.length + ')';
    },
  },
  methods: {
    ...mapActions(useWordsStore, ['step', 'getForLearn', 'toLearn', 'translate', 'saveLesson']),
    openLearnModal() {
      this.isOpenAddModal = true
      let data = this.getForLearn(this.batchCount)
      this.forTranslate = data.reduce((o, key) => ({ ...o, [key]: null}), {})
    },
    async autoTranslate() {
      const keys = Object.keys(this.forTranslate)
      let words = await this.translate(keys)
      words.forEach((val, i) => {
        this.forTranslate[keys[i]] = val
      })
    },
    acceptToLearn() {
      this.isOpenAddModal = false
      this.toLearn(this.forTranslate)
    },


    start() {
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
        let cases = shuffle(this.pool.filter(x => x !== translate)).slice(0, 3)
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
