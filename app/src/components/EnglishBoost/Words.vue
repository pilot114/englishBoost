<template>
    <div>
        <div v-for="word in batch">
            <p :state="word[2]" :style="styleSelect(word)" @click="toggle">{{ word[0] }}</p>
        </div>
    </div>
</template>

<script>
    export default {
        name: "Words",
        props: ['batch'],
        data() {
            return {
                unknown: {backgroundColor: '#ffffff'},
                learn: {backgroundColor: '#ffc107'},
                known: {backgroundColor: '#28a745'},
            }
        },
        methods: {
            styleSelect(word) {
                return this[word[2]];
            },
            toggle(event) {
                let word = event.target.textContent;
                let state = event.target.attributes.state.nodeValue;
                let newState = null;

                if (state === 'unknown') {
                    newState = 'learn';
                }
                if (state === 'learn') {
                    newState = 'known';
                }
                if (state === 'known') {
                    newState = 'unknown';
                }

                event.target.attributes.state.nodeValue = newState;
                event.target.style = 'background-color: ' + this[newState].backgroundColor;

                this.$root.$emit('toggleStateWord', {word: word, oldState: state, newState: newState});
            }
        }
    }
</script>
