<template>
  <div>
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-sm font-semibold text-gray-700">Выучено: {{ isPhraseMode ? 'фразы' : 'слова' }}</h2>
      <ModeSwitch />
    </div>

    <p v-if="!items.length" class="text-gray-500">
      {{
        isPhraseMode
          ? 'Здесь появятся фразы, которые вы полностью выучили.'
          : 'Здесь появятся слова, которые вы полностью выучили.'
      }}
    </p>

    <ul v-else class="divide-y divide-gray-200 rounded-lg border border-gray-200">
      <li
        v-for="[key, info] in items"
        :key="key"
        class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3"
      >
        <span class="font-medium break-words">
          {{ key }}
          <span
            v-if="info.basic"
            class="ml-1 rounded-sm bg-gray-100 px-1.5 py-0.5 align-middle text-xs font-normal text-gray-500"
            title="Входит в приложение изначально"
            >базовое</span
          >
        </span>
        <span class="text-sm break-words text-gray-500">{{ info.ru }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { PHRASE, useWordsStore } from '@/stores/words'
import ModeSwitch from '@/components/common/ModeSwitch.vue'

export default {
  components: { ModeSwitch },
  computed: {
    ...mapState(useWordsStore, ['archiveOf', 'getLearnMode']),
    isPhraseMode() {
      return this.getLearnMode === PHRASE
    },
    items() {
      // выученное своими силами показываем первым, базовую лексику — следом
      return Object.entries(this.archiveOf()).sort(
        ([, a], [, b]) => Number(a.basic ?? false) - Number(b.basic ?? false),
      )
    },
  },
}
</script>
