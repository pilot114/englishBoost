<template>
  <nav class="sticky top-0 z-40 bg-gray-800">
    <div class="mx-auto flex h-12 max-w-7xl items-center justify-between gap-2 px-2 sm:px-6 lg:px-8">
      <!-- разделы: иконки помещаются даже на узком экране, поэтому бургер не нужен -->
      <div class="flex items-center gap-1">
        <Tooltip
            v-for="page in pages"
            :key="page.id"
            :text="page.name"
        >
          <button
              type="button"
              :class="[
                  isCurrent(page)
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white',
                  'rounded-md p-2 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-white'
              ]"
              :aria-label="page.name"
              :aria-current="isCurrent(page) ? 'page' : undefined"
              @click="$emit('update:modelValue', page)"
          >
            <component :is="icons[page.id]" class="h-5 w-5" aria-hidden="true" />
          </button>
        </Tooltip>

        <span class="mx-1 hidden h-5 w-px bg-gray-700 sm:block" aria-hidden="true" />

        <!-- навыки, которых в приложении пока нет: видно, куда оно растёт.
             На узких экранах прячем — там дорог каждый пиксель -->
        <Tooltip
            v-for="mode in planned"
            :key="mode.name"
            :text="`${mode.name} — пока не реализовано`"
            class="hidden sm:flex"
        >
          <button
              type="button"
              disabled
              class="cursor-not-allowed rounded-md p-2 text-gray-600"
              :aria-label="`${mode.name} — пока не реализовано`"
          >
            <component :is="mode.icon" class="h-5 w-5" aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      <div class="flex shrink-0 items-center">
        <!-- переключатель языка -->
        <Menu as="div" class="relative shrink-0">
          <MenuButton
              class="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span class="sr-only">Язык изучения</span>
            <span class="text-base leading-none" aria-hidden="true">{{ getLanguageConfig.flag }}</span>
            <ChevronDownIcon class="h-4 w-4" aria-hidden="true" />
          </MenuButton>

          <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
          >
            <MenuItems
                class="absolute right-0 z-30 mt-2 w-44 origin-top-right overflow-hidden rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden"
            >
              <MenuItem
                  v-for="language in languageList"
                  :key="language.code"
                  v-slot="{ active }"
              >
                <button
                    type="button"
                    :class="[
                        active ? 'bg-gray-100' : '',
                        language.code === getLanguageCode ? 'font-semibold text-sky-700' : 'text-gray-700',
                        'flex w-full items-center gap-2 px-4 py-2 text-left text-sm'
                    ]"
                    @click="setLanguage(language.code)"
                >
                  <span class="text-lg leading-none" aria-hidden="true">{{ language.flag }}</span>
                  {{ language.name }}
                </button>
              </MenuItem>
            </MenuItems>
          </transition>
        </Menu>

        <Tooltip text="Как учить язык" align="right">
          <button
              type="button"
              class="rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-white"
              aria-label="Как учить язык"
              @click="$emit('open-guide')"
          >
            <InformationCircleIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </Tooltip>

        <Tooltip text="Настройки" align="right">
          <button
              type="button"
              class="rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-white"
              aria-label="Настройки"
              @click="$emit('open-settings')"
          >
            <Cog6ToothIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ChevronDownIcon, Cog6ToothIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import Tooltip from '@/components/common/Tooltip.vue'
</script>

<script>
import { mapActions, mapState } from 'pinia'
import {
  AcademicCapIcon,
  BookOpenIcon,
  CheckBadgeIcon,
  LanguageIcon,
  MicrophoneIcon,
  PencilSquareIcon,
  SpeakerWaveIcon,
} from '@heroicons/vue/24/outline'
import { useWordsStore } from '@/stores/words'
import { languageList } from '@/domain/languages'

export default {
  props: {
    pages: Array,
    modelValue: Object,
  },
  emits: ['update:modelValue', 'open-settings', 'open-guide'],
  computed: {
    ...mapState(useWordsStore, ['getLanguageCode', 'getLanguageConfig']),
    languageList: () => languageList,
    icons: () => ({
      1: BookOpenIcon,
      2: AcademicCapIcon,
      3: CheckBadgeIcon,
    }),
    /** навыки из инструкции, до которых приложение ещё не дошло */
    planned: () => [
      { name: 'Аудирование', icon: SpeakerWaveIcon },
      { name: 'Говорение', icon: MicrophoneIcon },
      { name: 'Письмо', icon: PencilSquareIcon },
      { name: 'Грамматика', icon: LanguageIcon },
    ],
  },
  methods: {
    ...mapActions(useWordsStore, ['setLanguage']),
    isCurrent(item) {
      return item.id === this.modelValue.id
    },
  },
}
</script>
