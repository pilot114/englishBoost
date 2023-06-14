<template>
  <div class="w-full px-4 py-16">
    <div class="mx-auto w-full max-w-md">
      <RadioGroup
          v-model="value"
      >
        <RadioGroupLabel class="sr-only">Server size</RadioGroupLabel>
        <div class="space-y-2">
          <RadioGroupOption
              as="template"
              v-for="(item, key) in items"
              :key="key"
              :value="item"
              v-slot="{ checked }"
          >
            <div
                :class="[
                checked ? 'bg-sky-900 bg-opacity-75 text-white' : 'bg-white',
              ]"
                class="relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md outline-none"
            >
              <div class="flex w-full items-center justify-between">
                <div class="flex items-center">
                  <div class="text-sm">
                    <RadioGroupLabel
                        as="p"
                        :class="checked ? 'text-white' : 'text-gray-900'"
                        class="font-medium"
                    >
                      {{ item }}
                    </RadioGroupLabel>
                    <RadioGroupDescription
                        as="span"
                        :class="checked ? 'text-sky-100' : 'text-gray-500'"
                        class="inline"
                    >
                    </RadioGroupDescription>
                  </div>
                </div>
                <div v-show="checked" class="shrink-0 text-white">
                  <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <circle
                        cx="12"
                        cy="12"
                        r="12"
                        fill="#fff"
                        fill-opacity="0.2"
                    />
                    <path
                        d="M7 13l3 3 7-7"
                        stroke="#fff"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </RadioGroupOption>
        </div>
      </RadioGroup>
    </div>
  </div>
</template>

<script>
import {RadioGroup, RadioGroupDescription, RadioGroupLabel, RadioGroupOption} from "@headlessui/vue";

export default {
  name: "Radio",
  components: {RadioGroupDescription, RadioGroupOption, RadioGroup, RadioGroupLabel},
  props: {
    modelValue: String,
    items: Array,
  },
  data() {
    return {
      value: this.modelValue
    }
  },
  emits: ['select', 'update:modelValue'],
  watch: {
    value(value) {
      if (!value) {
        return
      }
      this.$emit('update:modelValue', value)
      this.$emit('select', value)
      this.value = null
    },
  },
}
</script>