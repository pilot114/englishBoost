import { Engine } from './Engine.js'

let engine = new Engine()

const text = "The let keyword declares a BLock-scoped variable, which means that the variable " +
    "is only accessible within the block of code in which it was declared, whereas the var keyword " +
    "declares a variable with function scope which means that the variable is accessible within the entire function.\n" +
    "So, here we are just modifying the scope of the variables to be only block-scoped.";
const name = "Example"

// for preview parsed from source
let dict = engine.parse(text, name)

// CLICK
engine.append(dict)



// get previews
const previewDicts = engine.getDicts()
const previewWordPool = engine.getWordPool()
const previewIntervals = engine.getIntervals()

console.log(previewDicts)
console.log(previewWordPool)
console.log(previewIntervals)

    
// CLICK get top frequency without translate
const wordsForTranslate = engine.getTop100ForTranslate()
const translated = wordsForTranslate.map(word => {
    let tmp = {};
    tmp[word] = 'test'
    return tmp;
})
engine.setTranslate(translated)


// CLICK get top frequency and add to learn
engine.loadTop100()

// CLICK learn
let words = engine.getFromInterals()
engine.setToInterals(words)
