<script setup>
import NavBar from '@/components/common/NavBar.vue'
import Settings from '@/components/Settings.vue'
import Guide from '@/components/Guide.vue'

import Read from '@/components/views/Read.vue'
import Learn from '@/components/views/Learn.vue'
import Lexicon from '@/components/views/Lexicon.vue'
</script>

<template>
  <div class="min-h-screen bg-white">
    <NavBar
        v-model="page"
        :pages="pages"
        @open-settings="isOpenSettings = true"
        @open-guide="isOpenGuide = true"
    />

    <main class="container mx-auto w-full px-4 py-6">
      <Read v-if="page.id === 1"/>
      <Learn v-else-if="page.id === 2"/>
      <Lexicon v-else-if="page.id === 3"/>
    </main>

    <Settings
        :isOpen="isOpenSettings"
        @close="isOpenSettings = false"
    />

    <Guide
        :isOpen="isOpenGuide"
        @close="isOpenGuide = false"
    />
  </div>
</template>

<script>
  export default {
    data() {
      return {
        isOpenSettings: false,
        isOpenGuide: false,
        page: { id: 1, name: 'Чтение' },
        pages: [
          { id: 1, name: 'Чтение' },
          { id: 2, name: 'Обучение' },
          { id: 3, name: 'Словарный запас' },
        ],
      }
    },
  }
</script>
