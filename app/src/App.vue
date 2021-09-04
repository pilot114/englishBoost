<template>
    <div id="app">
        <EnglishBoost v-if="mode === 'englishBoost'" @back="mode = null"/>
        <Russian v-else-if="mode === 'russian'" @back="mode = null"/>

        <b-jumbotron v-else header="Выбери режим словаря">
            <b-button @click="mode = 'englishBoost'">English</b-button>
            <b-button @click="mode = 'russian'">Russian</b-button>
        </b-jumbotron>
    </div>
</template>

<script>
    import EnglishBoost from "./components/EnglishBoost";
    import Russian from "./components/Russian";

    export default {
        name: 'app',
        components: { EnglishBoost, Russian },
        data() {
            return {
                mode: null
            }
        }
    }
</script>
