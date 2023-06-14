<template>
  <div v-for="(value, key) in getArchive">
    {{ key }}: {{ value }}
  </div>
</template>

<script>
import {mapActions, mapState} from "pinia";
import {useWordsStore} from "@/stores/words";

export default {
  computed: {
    ...mapState(useWordsStore, ['getArchive']),
  }
}
</script>
