<template>
    <b-row>
        <!-- preloader-->
        <div class="lds-dual-ring" v-if="loading"></div>

        <b-col>
            <b-form-group>
                <b-file accept="text/*" v-model="textFile"></b-file>
            </b-form-group>

            <b-card v-if="newBook">
                <b-form-group>
                    <b-input v-model="newBook.title" placeholder="title"></b-input>
                    <b-input v-model="newBook.description" placeholder="description"></b-input>
                </b-form-group>
                <p class="card-text">Всего слов: {{ newBook.totalWordCount }}</p>
                <p class="card-text">Уникальных: {{ newBook.uniqCount }}</p>
                {{ newBook.words }}
            </b-card>
        </b-col>
    </b-row>
</template>

<script>
    import {Book} from '../../Words'

    export default {
        name: 'Dashboard',
        data() {
            return {
                loading: false,

                textFile: null, // File object
                text: null,
                newBook: null,
            }
        },
        watch: {
            /**
             * При загрузке файла подготавливаем информацию по предварительному анализу тектса
             */
            textFile() {
                this.loading = true;

                if (this.textFile) {
                    let reader = new FileReader();
                    reader.onload = () => {
                        this.text = reader.result;
                        this.newBook = new Book(this.text, this.textFile.name, '', 'russian');
                        this.loading = false;
                    };
                    reader.readAsText(this.textFile);
                }
            },
        },
        methods: {
        }
    }
</script>

<style>
</style>