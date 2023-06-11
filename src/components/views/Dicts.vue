<script setup>
import DictInfo from '@/components/DictInfo.vue'
import InputFile from '@/components/common/InputFile.vue'
import CardList from '@/components/common/CardList.vue'
</script>

<template>
  <InputFile
      v-if="!text"
      @load="loadFile"
  />
  <DictInfo
      v-else
      @add="add"
      @cancel="clear"
      :text="text"
      :name="name"
      :engine="engine"
  />

  <!--  TODO каждый словарь можно открыть в модалке, с списком слов слева+поиск, справа - статистика если слово не выбрано, контекст - если выбрано-->
  <CardList
      v-if="dicts.length > 0"
      :cards="dicts"
  >
    <template #default="{card}">
      <div v-if="card.description" class="font text-xs mb-2">{{ card.description }}</div>
      {{ trim(card.dict.text) }}
    </template>
  </CardList>
</template>

<script>

export default {
  data() {
    return {
      text: null,
      name: null,
      dicts: [],
    }
  },
  methods: {
    loadFile(text, name) {
      this.text = text;
      this.name = name;
    },
    add(dict) {
      this.engine.append(dict);
      this.dicts = this.engine.getDicts();
      this.clear();
    },
    clear() {
      this.text = null;
      this.name = null;
    },
    trim(text) {
      if (text.length > 100) {
        return text.slice(0, 100) + ' ...';
      }
      return text;
    }
  }
}
</script>
