<template>
  <Modal
    :isOpen="isOpen"
    title="Как учить язык"
    acceptText="Понятно"
    :showCancel="false"
    @accept="$emit('close')"
    @close="$emit('close')"
  >
    <div class="space-y-5 text-left text-sm text-gray-600">
      <section>
        <h4 class="mb-1 font-medium text-gray-900">Из чего складывается язык</h4>
        <p>
          Четыре навыка — чтение, аудирование, письмо, говорение — и два фундамента под ними: словарный запас и
          грамматика.
        </p>
      </section>

      <section>
        <h4 class="mb-1 font-medium text-gray-900">Вход и выход</h4>
        <p>
          <span class="font-medium">Пассивные</span> упражнения — вы потребляете язык: читаете, слушаете, разбираете
          слова. <span class="font-medium">Активные</span> — производите его сами: говорите, пишете, составляете свои
          предложения. Без второго первое не превращается в умение.
        </p>
      </section>

      <section>
        <h4 class="mb-1 font-medium text-gray-900">Час занятий</h4>
        <ul class="space-y-1">
          <li v-for="step in hour" :key="step.what" class="flex gap-2">
            <span class="w-14 shrink-0 tabular-nums text-gray-400">{{ step.time }}</span>
            <span>{{ step.what }}</span>
          </li>
        </ul>
      </section>

      <section>
        <h4 class="mb-1 font-medium text-gray-900">Неделя по дням</h4>
        <ul class="space-y-1">
          <li v-for="day in week" :key="day.day" class="flex gap-2">
            <span class="w-14 shrink-0 text-gray-400">{{ day.day }}</span>
            <span>{{ day.focus }}</span>
          </li>
        </ul>
      </section>

      <section class="rounded-md bg-amber-50 p-3">
        <h4 class="mb-1 font-medium text-gray-900">Три правила</h4>
        <ol class="list-inside list-decimal space-y-1">
          <li>Учите фразы, а не отдельные слова: не <em>decision</em>, а <em>make a decision</em>.</li>
          <li>Заканчивайте занятие тем, что сказали или написали что-то сами.</li>
          <li>Час каждый день сильнее, чем пять часов в воскресенье.</li>
        </ol>
      </section>
    </div>
  </Modal>
</template>

<script>
import Modal from '@/components/common/Modal.vue'

export default {
  name: 'Guide',
  components: { Modal },
  props: {
    isOpen: Boolean,
  },
  emits: ['close'],
  computed: {
    hour: () => [
      { time: '5 мин', what: 'разминка: 10–15 карточек или короткое видео' },
      { time: '35 мин', what: 'основной блок дня: теория и упражнения' },
      { time: '15 мин', what: 'активная отработка: сказать или написать по теме' },
      { time: '5 мин', what: 'итоги: выписать новые слова' },
    ],
    week: () => [
      { day: 'Пн', focus: 'грамматика и письмо' },
      { day: 'Вт', focus: 'аудирование и говорение' },
      { day: 'Ср', focus: 'чтение и словарный запас' },
      { day: 'Чт', focus: 'разговорный интенсив' },
      { day: 'Пт', focus: 'закрепление за неделю' },
      { day: 'Сб–Вс', focus: 'фильм или книга без конспекта' },
    ],
  },
}
</script>
