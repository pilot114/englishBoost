<template>
  <div class="px-10 pb-5 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3">
    <div
        v-for="(card) of cards"
        class="rounded overflow-hidden shadow-lg hover:bg-blue-100 border border-gray-300"
    >
      <div class="px-6 py-4" style="cursor: pointer">
        <div class="font-bold text-xl mb-2">{{ card.name }}</div>
        <p class="text-gray-700 text-base">
          <slot :card="card">
            {{ card.text }}
          </slot>
        </p>
      </div>
      <div class="px-6 pt-4 pb-2">
        <span
            v-for="(tag) of card.tags"
            class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
          #{{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CardList",
  props: {
    cards: Array,
  },
}
</script>
