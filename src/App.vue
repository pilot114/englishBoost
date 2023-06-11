<script setup>
import NavBar from '@/components/common/NavBar.vue'
import Footer from '@/components/common/Footer.vue'

import Dicts from '@/components/views/Dicts.vue'
import Learn from '@/components/views/Learn.vue'
import Lexicon from '@/components/views/Lexicon.vue'
</script>

<template>
  <NavBar
      v-model="page"
      :pages="pages"
      img="./english.png"
  />
  <main class="container mx-auto px-4">
    <Dicts v-if="page.id === 1"/>
    <Learn v-if="page.id === 2"/>
    <Lexicon v-if="page.id === 3"/>
  </main>
  <Footer :pages="[{name: 'Контакты'}]"/>
</template>

<script>
  export default {
    data() {
      return {
        page: { id: 1, name: 'Словари' },
        pages: [
          { id: 1, name: 'Словари' },
          { id: 2, name: 'Обучение' },
          { id: 3, name: 'Словарный запас' },
        ],
      }
    },
  }
</script>