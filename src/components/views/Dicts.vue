<script setup>
import DictInfo from '@/components/DictInfo.vue'
import InputFile from '@/components/common/InputFile.vue'
import CardList from '@/components/common/CardList.vue'

import { mapState } from 'pinia'
import { useWordsStore } from "@/stores/words"
</script>
as
<template>
  <DictInfo
      v-if="text"
      @close="clear"
      :text="text"
      :name="name"
  />
  <InputFile
      v-else
      @load="loadFile"
  />

  <!--  TODO каждый словарь можно открыть в модалке, с списком слов слева+поиск, справа - статистика если слово не выбрано, контекст - если выбрано-->
  <CardList
      :cards="getDicts"
  >
    <template #default="{card}">
      <div v-if="card.description" class="font text-xs mb-2">{{ card.description }}</div>
      {{ trim(card.text) }}
    </template>
  </CardList>
</template>

<script>

export default {
  data() {
    return {
      text: null,
      name: null,
    }
  },
  computed: {
    ...mapState(useWordsStore, ['getDicts', 'getWordPoolSize']),
  },
  methods: {
    loadFile(text, name) {
      this.text = text
      this.name = name
    },
    clear() {
      this.text = null
      this.name = null
    },
    trim(text) {
      if (text.length > 100) {
        return text.slice(0, 100) + ' ...'
      }
      return text
    }
  }
}
</script>
