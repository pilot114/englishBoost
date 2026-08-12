<template>
  <button
      type="button"
      class="rounded-lg border border-gray-200 px-5 py-2.5 text-center text-sm font-medium transition focus:outline-hidden focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
      :class="colors[color]"
  >
    {{ text }}
  </button>
</template>

<script>
export default {
  name: "Button",
  props: {
    text: String,
    color: {
      type: String,
      default: 'white',
    },
  },
  data() {
    return {
      colors: {
        white: 'bg-white text-gray-800 hover:bg-slate-100',
        cyan: 'bg-cyan-500 text-white hover:bg-cyan-600',
        orange: 'bg-orange-500 text-white hover:bg-orange-600',
        green: 'bg-green-600 text-white hover:bg-green-700',
        red: 'bg-red-600 text-white hover:bg-red-700',
      }
    }
  },
}
</script>
