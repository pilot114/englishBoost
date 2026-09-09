<template>
  <Modal
      :isOpen="isOpen"
      title="Настройки"
      acceptText="Закрыть"
      :showCancel="false"
      @accept="$emit('close')"
      @close="$emit('close')"
  >
    <div class="space-y-6 text-left">
      <!-- размер шрифта -->
      <div>
        <div class="mb-2 text-sm font-medium text-gray-900">Размер шрифта в читалке</div>

        <div class="flex items-center gap-3">
          <button
              type="button"
              class="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              :disabled="getFontSize <= MIN_FONT_SIZE"
              aria-label="Уменьшить шрифт"
              @click="setFontSize(getFontSize - 2)"
          >A−</button>

          <span class="w-14 text-center text-sm text-gray-500">{{ getFontSize }} px</span>

          <button
              type="button"
              class="rounded-md border border-gray-300 px-3 py-1.5 text-base disabled:opacity-40 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              :disabled="getFontSize >= MAX_FONT_SIZE"
              aria-label="Увеличить шрифт"
              @click="setFontSize(getFontSize + 2)"
          >A+</button>
        </div>

        <p class="mt-2 text-gray-700" :style="{ fontSize: getFontSize + 'px' }">
          Так будет выглядеть текст.
        </p>
      </div>

      <!-- обозначения в читалке -->
      <div>
        <div class="mb-2 text-sm font-medium text-gray-900">Подсветка слов</div>
        <ul class="space-y-1 text-sm text-gray-500">
          <li><span class="underline decoration-amber-400 decoration-dotted underline-offset-4">новое</span> — ещё не взято в изучение</li>
          <li><span class="rounded-sm bg-sky-200/70 px-1">изучается</span> — в текущих повторениях</li>
          <li><span class="rounded-sm bg-green-100 px-1">выучено</span> — в словарном запасе</li>
        </ul>
      </div>

      <!-- переводчик -->
      <div class="border-t border-gray-200 pt-4">
        <div class="mb-2 text-sm font-medium text-gray-900">Локальная модель</div>
        <p class="mb-3 text-sm text-gray-500">
          Первая загрузка модели занимает минуты — перевод столько не ждёт и падает по таймауту.
          Прогрев поднимает её заранее, одного раза на запуск сервера достаточно.
        </p>

        <div class="flex flex-wrap items-center gap-3">
          <button
              type="button"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              :disabled="warming"
              @click="warmUp"
          >
            {{ warming ? 'Прогреваем…' : 'Прогреть модель' }}
          </button>

          <button
              v-if="warming"
              type="button"
              class="rounded-lg px-2 py-2 text-sm text-gray-500 hover:text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              @click="cancelWarmUp"
          >
            Отменить
          </button>

          <span v-if="warming" class="text-sm text-gray-500">{{ elapsed }} с</span>
          <span v-else-if="warmState === 'ready'" class="text-sm text-green-600">
            Модель готова — {{ elapsed }} с
          </span>
          <span v-else-if="warmState === 'error'" class="text-sm text-red-600">{{ warmError }}</span>
        </div>
      </div>

      <!-- отладка -->
      <div class="border-t border-gray-200 pt-4">
        <div class="mb-2 text-sm font-medium text-gray-900">Отладка</div>
        <p class="mb-3 text-sm text-gray-500">
          Приблизить счётчики повторения на день вперёд, не дожидаясь завтра.
        </p>
        <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            @click="skipDay"
        >
          {{ skipped ? `+${skipped} ${skipped === 1 ? 'день' : 'дн.'}` : '+1 день' }}
        </button>
      </div>

      <!-- сброс -->
      <div class="border-t border-gray-200 pt-4">
        <div class="mb-3 text-sm font-medium text-gray-900">Сброс</div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <button
                type="button"
                class="mb-1 w-full rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                @click="resetLearning"
            >
              Удалить прогресс
            </button>
            <p class="text-xs text-gray-500">
              Уровни обнулятся, словарный запас очистится.
              Тексты, фразы и переводы останутся.
            </p>
          </div>

          <div>
            <button
                type="button"
                class="mb-1 w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                @click="resetAll"
            >
              Удалить всё
            </button>
            <p class="text-xs text-gray-500">
              Тексты, словарь и прогресс по всем языкам.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import Modal from '@/components/common/Modal.vue'
import { MAX_FONT_SIZE, MIN_FONT_SIZE, useWordsStore } from '@/stores/words'
import { warmup, WARMUP_TIMEOUT } from '@/domain/translator'

export default {
  name: 'Settings',
  components: { Modal },
  props: {
    isOpen: Boolean,
  },
  emits: ['close'],
  data() {
    return {
      // сколько дней промотали за это открытие окна — обратная связь на нажатие
      skipped: 0,
      // idle → loading → ready | error; переживает закрытие окна, но не перезагрузку
      // страницы: за это время модель могла успеть выгрузиться
      warmState: 'idle',
      warmError: '',
      // секунды с начала прогрева: загрузка идёт минутами, без счётчика непонятно, живо ли оно
      elapsed: 0,
      warmController: null,
      warmTimer: null,
    }
  },
  watch: {
    isOpen(open) {
      if (open) {
        this.skipped = 0
      }
    },
  },
  computed: {
    ...mapState(useWordsStore, ['getFontSize']),
    MIN_FONT_SIZE: () => MIN_FONT_SIZE,
    MAX_FONT_SIZE: () => MAX_FONT_SIZE,
    warming() {
      return this.warmState === 'loading'
    },
  },
  // прогрев не привязан к окну: закрыли настройки — модель всё равно догрузится
  beforeUnmount() {
    clearInterval(this.warmTimer)
  },
  methods: {
    ...mapActions(useWordsStore, ['setFontSize', 'step', 'resetProgress', '$reset']),
    skipDay() {
      this.step()
      this.skipped++
    },
    async warmUp() {
      const controller = new AbortController()

      this.warmController = controller
      this.warmState = 'loading'
      this.warmError = ''
      this.elapsed = 0
      this.warmTimer = setInterval(() => this.elapsed++, 1000)

      try {
        await warmup({ signal: controller.signal })
        this.warmState = 'ready'
      } catch (error) {
        // отменил пользователь — это не ошибка, просто возвращаем кнопку в исходное
        if (controller.signal.aborted) {
          this.warmState = 'idle'
        } else {
          this.warmState = 'error'
          this.warmError = error.name === 'TimeoutError'
              ? `Модель не поднялась за ${Math.round(WARMUP_TIMEOUT / 60000)} мин`
              : 'Локальная модель недоступна'
        }
      } finally {
        clearInterval(this.warmTimer)
        this.warmTimer = null
        this.warmController = null
      }
    },
    cancelWarmUp() {
      this.warmController?.abort()
    },
    resetLearning() {
      if (window.confirm('Обнулить прогресс обучения? Тексты и фразы останутся.')) {
        this.resetProgress()
        this.$emit('close')
      }
    },
    resetAll() {
      if (window.confirm('Удалить все тексты, словарь и прогресс по всем языкам?')) {
        this.$reset()
        this.$emit('close')
      }
    },
  },
}
</script>
