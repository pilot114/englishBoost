<template>
    <b-container fluid v-cloak>
        <b-row>
            <b-col>
                <b-link @click="$emit('back')">← back</b-link>
<!--                https://github.com/dkulagin/kartaslov/tree/master/dataset/open_semantics-->
                <h1>Словарь слов с разметкой</h1>

                <Dashboard/>
            </b-col>
        </b-row>
    </b-container>
</template>

<script>
import Dashboard from "./Russian/Dashboard";

export default {
    name: "Russian",
    components: { Dashboard },
    data() {
        return {
        }
    },
    methods: {
        clearState() {
            localStorage.clear();
            alert('localStorage clear');
        },
    }
}
</script>

<style scoped>
[v-cloak] {
    display: none;
}
</style>