<script setup>
import InputText from './common/InputText.vue'
import Button from './common/Button.vue'

import { mapActions } from 'pinia'
import { useWordsStore } from "@/stores/words"
</script>

<template>
  <div v-if="newBook" class="px-10 py-5 border rounded-md mt-5">
    <div class="grid grid-cols-3 gap-4">
      <InputText v-model="newBook.name" placeholder="Название"/>
      <InputText class="col-span-2" v-model="newBook.description" placeholder="Описание"/>
    </div>

    <div class="py-5">
<!--      <p>Всего слов: {{ newBook.dict.words.length }}</p>-->
<!--      <p>Уникальных: {{ Object.keys(newBook.dict.frequency).length }}</p>-->

<!--      <p>Из них:</p>-->
<!--      <p>Новые - {{ newBook.counters.new }}</p>-->
<!--      <p>На изучение - {{ newBook.counters.unknown }}</p>-->
<!--      <p>Изучаю - {{ newBook.counters.learn }}</p>-->
<!--      <p>Знаю - {{ newBook.counters.known }}</p>-->
    </div>

    <Button
        text="Добавить"
        color="green"
        @click="add"
    />
    <Button
        text="Отмена"
        color="white"
        @click="$emit('close')"
    />
  </div>
</template>

<script>
export default {
  name: "DictInfo",
  props: {
    text: String,
    name: String,
  },
  created() {
    this.newBook = this.parse(this.text)
    this.newBook.name = this.name
  },
  data() {
    return {
      newBook: null,
    }
  },
  methods: {
    ...mapActions(useWordsStore, ['parse', 'append']),
    add() {
      this.append(this.newBook)
      this.$emit('close')
    }
  }
}
</script>
