<template>
  <div class="group relative flex">
    <slot />

    <!--
      Подпись видна только под курсором; для скринридера её нет — у кнопки уже есть aria-label.
      Показываем по hover и по focus-visible, но не по focus: клик мышью оставляет фокус на
      кнопке, и подпись висела бы над выбранным разделом, пока не кликнешь мимо.
    -->
    <span
      :class="[
        align === 'right' ? 'right-0' : 'left-0',
        'pointer-events-none absolute top-full z-50 mt-1 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1',
        'text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity',
        'group-hover:opacity-100 group-has-[:focus-visible]:opacity-100',
      ]"
      aria-hidden="true"
      >{{ text }}</span
    >
  </div>
</template>

<script>
export default {
  name: 'Tooltip',
  props: {
    text: String,
    // у крайних кнопок подпись шире самой иконки: слева её прижимаем к левому краю,
    // справа — к правому, иначе она уезжает за границу экрана
    align: {
      type: String,
      default: 'left',
    },
  },
}
</script>
