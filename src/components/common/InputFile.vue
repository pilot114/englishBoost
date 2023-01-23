<script setup>
import Spinner from './Spinner.vue'
</script>

<template>
  <div class="flex flex-row px-10 py-5">
      <Spinner v-if="loading"/>
      <input
          @change="readFile"
          ref="file"
          type="file"
          accept="text/*"
          class="block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold hover:file:bg-blue-100"
      />
  </div>
</template>

<script>
export default {
  name: "InputFile",
  data() {
    return {
      text: null,
      name: null,
      loading: false,
    }
  },
  methods: {
    readFile() {
      const file = this.$refs.file.files[0];
      this.name = file.name;

      this.loading = true;
      const reader = new FileReader();
      reader.onload = () => {
        this.text = reader.result;
        this.$emit('load', this.text, this.name);
        this.loading = false;
      };
      reader.readAsText(file);
    }
  },
}
</script>
