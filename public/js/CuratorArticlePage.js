const ArticlePage = {}

ArticlePage.init = function() {

  Actions.updateSelections(taskRun)

  Visuals.showHideConditionals(taskRun.condition_order[taskRun.current_condition])

  ArticlePage.addWordHighlights()

  Visuals.fixFancyNumbers()
  Visuals.removeDescriptions()
  // Visuals.addNumberDescriptions()

  var unix = Math.round(+new Date()/1000);

  axios.post('/log/', {
      action: "showArticle",
      info: {
          topic: TOPICDATA.claim_id,
          article: articleDATA._id,
          timestamp: unix
      }
    }
  );

}

ArticlePage.toggleTopSentences = function() {
  let opened = Visuals.toggleOpenClosed($("#topSentences")[0])
  var unix = Math.round(+new Date()/1000);

  if(opened) {
    axios.post('/log/', {
        action: "show-articleTopSentences",
        info: {
          topic: TOPICDATA.claim_id,
          article: articleDATA._id,
          timestamp: unix
        }
      }
    );
  } else {
    axios.post('/log/', {
        action: "hide-articleTopSentences",
        info: {
          topic: TOPICDATA.claim_id,
          article: articleDATA._id,
          timestamp: unix
        }
      }
    );
  }
}

ArticlePage.toggleArticleWords = function() {

  let title = $("#articleText")[0]
  let switchInput = $('#articleWordsSwitch')[0]
  var unix = Math.round(+new Date()/1000)
  // let new_amount = 0

  if(title.classList.contains('highlight-off'))
  {
    title.classList.remove('highlight-off')
    title.classList.add('highlight-on')
    switchInput.checked = true;

    let words = $(".highlit-word")
    for(let word of words) {
      let amount = word.dataset.amount
      // console.log("amount: ",amount)
      if (amount > 1){
        amount = parseInt(amount) + 20;
        new_amount = Math.min(amount, 120)
        word.style.backgroundColor = "rgba(98, 200, 165, "+(new_amount / 100)+")"
      }else{
        word.style.backgroundColor = "rgba(98, 200, 165, 0)"
      }
    }
  }
  else
  {
    title.classList.remove('highlight-on')
    title.classList.add('highlight-off')
    switchInput.checked = false;
    let words = $(".highlit-word")
    for(let word of words) {
      word.style.backgroundColor = "rgba(98, 200, 165, 0)"
    }
  }

  if(switchInput.checked) {
    axios.post('/log/', {
        action: "show-articleWords",
        info: {
          topic: TOPICDATA.claim_id,
          article: articleDATA._id,
          timestamp: unix
        }
      }
    );
  } else {
    axios.post('/log/', {
        action: "hide-articleWords",
        info: {
          topic: TOPICDATA.claim_id,
          article: articleDATA._id,
          timestamp: unix
        }
      }
    );
  }
}


ArticlePage.addWordHighlights = function() {

  let text = $("#articleText")[0];

  text.innerText = ""

  // let words = articleDATA.text.split(' ')

  let tot_Length = articleDATA.attentions.length - 1;
  var punctuations = [".", ",", ":", ";", "!", "?"];

  for(let i = 0; i < tot_Length; i++)
  {
    let w = articleDATA.attentions[i][0];
    let w_next = articleDATA.attentions[i+1][0];
    let attention = articleDATA.attentions[i][1];

    let word = document.createElement('span');
        word.innerText = w;
        word.className = 'highlit-word';

    let amount = Math.round(parseFloat(attention) * 100)
 
    // console.log(Math.min(amount * 1.1, 256), amount)
    // amount = Math.min(amount * 1.1, 256);

    word.dataset.amount = amount;

    word.style.textDecorationColor = "rgba(98, 200, 165, 0)"

    if(amount > 1)
    {
      //word.style.backgroundColor = "rgba(98, 200, 165, "+(amount / 100)+")"
      word.style.textDecorationColor = "rgba(98, 200, 165, "+ (amount / 100)+")" // Math.min(amount * 1.0, 25600)
      word.className += " inspectable"
      let tip = document.createElement('span');
          tip.innerText = amount + "% important";
          tip.className = 'word-tooltip';
      word.appendChild(tip)
    }

    let space = document.createElement('span');
        space.innerText = " ";
        space.className = 'highlit-word';
        space.style.textDecorationColor = "rgba(0, 0, 0, 0)"

    text.appendChild(word);

    // console.log(w_next)
    if (punctuations.indexOf(w_next) < 0){
      // console.log(punctuations.indexOf(w_next))
      text.appendChild(space);    
    }
    // else{
    //   console.log('punctuations!')
    // }
  }

  text.style.opacity = 1;
}


// ---  old ---- 
// ArticlePage.addWordHighlights = function() {

//   let text = $("#articleText")[0];

//   text.innerText = ""

//   let words = articleDATA.text.split(' ')

//   //console.log(words.length +" vs "+ articleDATA.attentions.length)
//   let minLength = 0;
//   if(words.length < articleDATA.attentions.length)
//   {
//     minLength = words.length
//   }
//   else {
//     minLength = articleDATA.attentions.length
//   }

//   for(let i = 0; i < minLength; i++)
//   {
//     let w = words[i];
//     let attention = articleDATA.attentions[i];

//     let word = document.createElement('span');
//         word.innerText = w;
//         word.className = 'highlit-word';

//     let amount = Math.round(parseFloat(attention) * 100)
//     word.dataset.amount = amount;

//     word.style.textDecorationColor = "rgba(98, 200, 165, 0)"

//     if(amount > 1)
//     {
//       //word.style.backgroundColor = "rgba(98, 200, 165, "+(amount / 100)+")"
//       word.style.textDecorationColor = "rgba(98, 200, 165, "+ (amount / 100)+")"
//       word.className += " inspectable"
//       let tip = document.createElement('span');
//           tip.innerText = amount + "% important";
//           tip.className = 'word-tooltip';
//       word.appendChild(tip)
//     }

//     let space = document.createElement('span');
//         space.innerText = " ";
//         space.className = 'highlit-word';
//         space.style.textDecorationColor = "rgba(0, 0, 0, 0)"

//     text.appendChild(word);
//     text.appendChild(space);
//   }

//   text.style.opacity = 1;
// }
