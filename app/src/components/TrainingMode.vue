<template>
    <div>
        <b-row>
            <b-col>
                <b-button size="sm" variant="outline-secondary" @click="$emit('closeTraining', dictionary)">Back</b-button>
                <div class="float-right">
                    <b-check-group button-variant="outline-secondary" size="sm" buttons :options="sorts"/>
                </div>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-pagination-nav align="center" base-url="#"
                                  :number-of-pages="Math.ceil(dictionary.words.length/200)"
                                  v-model="currentPage"/>
            </b-col>
        </b-row>
        <b-row>
            <b-col v-for="(wordColumn, index) in getPage(dictionary, currentPage, 8)" :key="index">
                <p v-for="word in wordColumn"> {{word}} </p>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <b-button size="sm" variant="outline-secondary" @click="$emit('closeTraining', dictionary)">Back</b-button>
            </b-col>
        </b-row>
    </div>
</template>

<script>
    export default {
        name: 'TrainingMode',
        props: {
            dictionary: null,
        },
        data() {
            return {
                currentPage: 1,
                sorts: [
                    { text: 'Sort by frequency', value: 1 },
                    { text: 'Sort by alphabet', value: 2 },
                    { text: 'Sort by type', value: 3 },
                ]
            }
        },
        methods: {
            getPage(dictionary, index, columnCount) {
                let wordsInPage = Math.ceil(dictionary.words.length / index) * 200;
                let page = dictionary.words.slice((index-1)*200, index*200);

                let wordsInColumn = Math.ceil(page.length / (columnCount));

                let batches = [];
                let batch = [];
                for (let i = 0; i < page.length; i++) {
                    batch.push(page[i]);
                    if ((i+1) % wordsInColumn === 0) {
                        batches.push(batch);
                        batch = [];
                    }
                }
                batches.push(batch);
                return batches;
            }
        }
    }
</script>
