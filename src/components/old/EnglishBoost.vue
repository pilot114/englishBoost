<template>
    <b-container fluid v-cloak>
        <b-row>
            <b-col>
                <h1>English Boost v1.1</h1>

            </b-col>
            <b-col>
              <b-form-group>
                debug
                <b-button size="sm" variant="outline-secondary" @click="clearState">Clear storage</b-button>
                <b-button size="sm" variant="outline-secondary" @click="nextDay">Next day</b-button>
              </b-form-group>
            </b-col>
        </b-row>

<!--        <ExploreMode-->
<!--            v-if="exploreMode"-->
<!--            :book="currentBook"-->
<!--            @closeExplore="exploreMode = !exploreMode"-->
<!--        ></ExploreMode>-->

<!--        <TrainingMode-->
<!--            v-if="trainingMode"-->
<!--            :dictionary="currentDict"-->
<!--            @closeTraining="trainingMode = !trainingMode"-->
<!--        ></TrainingMode>-->

<!--        <Dashboard-->
<!--            v-if="!exploreMode && !trainingMode"-->
<!--            @explore=exploreBook-->
<!--            @training=trainingDict-->
<!--        ></Dashboard>-->
    </b-container>
</template>

<script>
import TrainingMode from "./TrainingMode.vue";
import ExploreMode from "./ExploreMode.vue";
import Dashboard from "./Dashboard.vue";

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
        nextDay() {},
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