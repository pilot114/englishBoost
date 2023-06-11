<template>
  <footer class="fixed bottom-0 left-0 z-20 w-full p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-between md:p-5 dark:bg-gray-800 dark:border-gray-600">
    <span class="text-sm text-gray-500 sm:text-center dark:text-gray-400">
      © {{ new Date().getFullYear() }} <a href="https://wshell.ru" class="hover:underline">wShell™</a>. All Rights Reserved
    </span>
    <ul class="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
      <li
          v-for="page in pages"
          :key="page.name"
      >
        <a :href="page.url" class="mr-4 hover:underline md:mr-6">{{ page.name }}</a>
      </li>
    </ul>
  </footer>
</template>

<script>
export default {
  name: "Footer",
  props: {
    pages: Array,
  },
}
</script>
