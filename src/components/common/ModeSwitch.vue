<template>
  <div class="inline-flex shrink-0 rounded-md border border-gray-300 p-0.5" role="group" aria-label="Режим изучения">
    <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :class="[
            getLearnMode === option.value
            ? 'bg-sky-600 text-white'
            : 'text-gray-600 hover:bg-gray-100',
            'rounded-sm px-2.5 py-1 text-xs font-medium transition focus:outline-hidden focus:ring-2 focus:ring-sky-500'
        ]"
        :aria-pressed="getLearnMode === option.value"
        @click="setLearnMode(option.value)"
    >{{ option.label }}</button>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { PHRASE, useWordsStore, WORD } from '@/stores/words'

export default {
  name: 'ModeSwitch',
  computed: {
    ...mapState(useWordsStore, ['getLearnMode']),
    options: () => [
      { value: WORD, label: 'Слова' },
      { value: PHRASE, label: 'Фразы' },
    ],
  },
  methods: {
    ...mapActions(useWordsStore, ['setLearnMode']),
  },
}
</script>
