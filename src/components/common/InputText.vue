<template>
    <input
        type="text"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        class="
              mt-1
              block
              w-full
              rounded-md
              bg-gray-100
              border-transparent
              focus:border-gray-500 focus:bg-white focus:ring-0
            "
    >
</template>

<script>
export default {
  name: "InputFile",
  props: {
    placeholder: String,
    modelValue: String,
  },
}
</script>
