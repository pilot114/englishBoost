/**
 * Example use of Engine
 */
/*

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
let words = engine.getFromIntervals()
engine.setToIntervals(words)
*/