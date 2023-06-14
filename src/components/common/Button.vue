<template>
  <button
      class="text-black-700 border font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
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
        white: 'bg-white hover:bg-slate-100',
        cyan: 'bg-cyan-500 hover:bg-cyan-600',
        orange: 'bg-orange-500 hover:bg-orange-600',
        green: 'bg-green-500 hover:bg-green-600',
        red: 'bg-red-500 hover:bg-red-600',
      }
    }
  },
}
</script>
