<template>
  <div class="px-10">
    <div class="w-full bg-gray-200 rounded-full dark:bg-gray-700">
      <div
          class="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full"
          :style="{width: this.percent + '%'}"
      >
        {{ percent }}%
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Progress",
  props: {
    percent: {
      type: Number,
      default: 0
    }
  },
}
</script>
