<script setup>
import NavBar from './components/common/NavBar.vue'
import CardList from './components/common/CardList.vue'
import Modal from './components/common/Modal.vue'
import InputFile from './components/common/InputFile.vue'
import DictInfo from './components/DictInfo.vue'
</script>

<template>
  <NavBar
      v-model="page"
      :pages="pages"
      img="./english.png"
  />
  <main class="container mx-auto px-4">
    <div class="bg-green-100">
      {{ engine }}
    </div>
    <template v-if="page.id === 1">
      <DictInfo
          v-if="text"
          @add="add"
          @cancel="text = null"
          :text="text"
          :name="name"
      />
      <InputFile
          v-else
          @load="loadFile"
      />

      <!--  каждый словарь можно открыть в модалке, с списком слов слева+поиск,-->
      <!--  справа - статистика если слово не выбрано, контекст - если выбрано-->
      <CardList
          v-if="page.id === 1"
          :cards="dicts"
      >
        <template #default="{card}">
          {{ card.description }}
        </template>
      </CardList>
    </template>

    <!--  TODO: модалка обучения, слот -->
    <Modal
        v-if="page.id === 2"
    />
    <!--  TODO: изученное -->
  </main>
</template>

<script>
  import Engine from "@/domain/Engine";

  export default {
    data() {
      return {
        //navigation
        page: { id: 1, name: 'Словари' },
        pages: [
          { id: 1, name: 'Словари' },
          { id: 2, name: 'Обучение' },
          { id: 3, name: 'Словарный запас' },
        ],

        // new dict
        text: null,
        name: null,
      }
    },
    created() {
      this.engine = new Engine();
      this.load();
    },
    methods: {
      loadFile(text, name) {
        this.text = text;
        this.name = name;
      },
      add(dict) {
        this.dicts.push(dict);
        this.text = null;
        this.save();
      },

      // localStorage
      load() {
        const dicts = JSON.parse(localStorage.getItem('dicts')) || [];
        dicts.forEach(dict => {
          // this.engine.append(dict);
        });
      },
      save() {
        try {
          localStorage.setItem('dicts', JSON.stringify(this.dicts));
        } catch (e) {
          if (e === QUOTA_EXCEEDED_ERR) {
            alert('localStorage overflow');
          }
        }
      },
    }
  }
</script>