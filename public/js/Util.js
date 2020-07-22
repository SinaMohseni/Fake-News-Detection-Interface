const Util = {

  chooseRandom : function(choices) {
    return choices[Math.floor(Math.random() * Math.floor(choices.length))]
  },

  shuffle : function(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
      [array[i], array[j]] = [array[j], array[i]]; // swap elements
    }
  },

  sort : function(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
      [array[i], array[j]] = [array[j], array[i]]; // swap elements
    }
  },

}

function hide(query)
{
  let selection = $(query);
  for(let elem of selection) {
    elem.classList.remove('visible')
    elem.classList.add('hidden')
  }
}

function show(query)
{
  let selection = $(query);
  for(let elem of selection) {
    elem.classList.remove('hidden')
    elem.classList.add('visible')
  }
}
