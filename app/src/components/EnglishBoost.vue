<template>
    <b-container fluid v-cloak>
        <b-row>
            <b-col>
                <b-link @click="$emit('back')">← back</b-link>
                <h1>English Boost v1.0</h1>

                <b-form-group>
                    <b-button size="sm" variant="outline-secondary" @click="clearState">Clear storage</b-button>
                </b-form-group>
            </b-col>
        </b-row>

        <ExploreMode
            v-if="exploreMode"
            :book="currentBook"
            @closeExplore="exploreMode = !exploreMode"
        ></ExploreMode>

        <TrainingMode
            v-if="trainingMode"
            :dictionary="currentDict"
            @closeTraining="trainingMode = !trainingMode"
        ></TrainingMode>

        <Dashboard
            v-if="!exploreMode && !trainingMode"
            @explore=exploreBook
            @training=trainingDict
        ></Dashboard>
    </b-container>
</template>

<script>
import TrainingMode from "./EnglishBoost/TrainingMode";
import ExploreMode from "./EnglishBoost/ExploreMode";
import Dashboard from "./EnglishBoost/Dashboard";

export default {
    name: "EnglishBoost",
    components: {TrainingMode, ExploreMode, Dashboard},
    data() {
        return {
            trainingMode: false,
            exploreMode: false,
            currentBook: null,
            currentDict: null,
        }
    },
    methods: {
        clearState() {
            localStorage.clear();
            alert('localStorage clear');
        },
        exploreBook(book) {
            this.currentBook = book;
            this.exploreMode = !this.exploreMode;
        },
        trainingDict(dict) {
            this.currentDict = dict;
            this.trainingMode = !this.trainingMode;
        },
    }
}
</script>

<style scoped>
[v-cloak] {
    display: none;
}
</style>