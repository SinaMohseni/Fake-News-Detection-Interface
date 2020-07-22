const TopicPage = {}
prediction_task_done = false; 

TopicPage.init = function() {

  TopicPage.shuffleArticles()

  Actions.updateSelections(taskRun)

  // console.log("condition: ", taskRun.condition_order[taskRun.current_condition])

  Visuals.showHideConditionals(taskRun.condition_order[taskRun.current_condition])

  TopicPage.addTopicWordHighlights();

  var unix = Math.round(+new Date()/1000);

  // if (taskRun.mturk_id == 'god'){
  //   // always open
  //   TopicPage.toggleClaimWords()
  //   Visuals.toggleOpenClosed($("#claimConfidences")[0])
  //   Visuals.toggleOpenClosed($("#claimPrediction")[0])
  // }else{
  //   // always close: do nothing
  //   // keep last condition
  // }

  // - attribute score
  Visuals.fixFancyNumbers()
  Visuals.removeDescriptions()
  
  // - verbal description
  // Visuals.addNumberDescriptions()

  // - attribute bar chart only
  // Visuals.fixFancyBars()
  // Visuals.removeDescriptions()

  // - circle visualization
  // Visuals.fixFancyNumbers();
  
  Visuals.colorText()

  axios.post('/log/', {
      action: "showTopic",
      info: {
          topic: TOPICDATA.claim_id,
          timestamp: unix
      }
    }
  );

}



// Visuals.fixFancyNumbers = function() {
//   let fancyNums = $('.fancy-number');
//   for(let num of fancyNums) {
//     let n = Math.round(parseFloat(num.innerHTML) * 100)
//     //console.log(n);
//     // round the number
//     if (n > 9)
//       num.innerText = n + '%'
//     else
//       num.innerText = n + ' %'
    
//     num.dataset.numValue = n;

//     let color = Visuals.interpolateColor( [179, 42, 37], [0, 51, 153], n/100 )
//     num.style.backgroundColor =
//       "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")"
//   }
// }


TopicPage.shuffleArticles = function() {
  let articleList = $('#articleList')[0]
  let articleBoxes = $('.article-box')

  // remove them all
  for(let box of articleBoxes)
  {
    articleList.removeChild(box)
  }

  // disabled shuffling because i thought it was confusing to come back to the Topic page and for things to be a different order
  // Util.shuffle(articleBoxes)

  for(let box of articleBoxes)
  {
    articleList.appendChild(box)
    box.style.opacity = 1;
  }
}


TopicPage.toggleClaimPrediction = function() {
  
  var unix = Math.round(+new Date()/1000);

  this_condition = taskRun.condition_order[taskRun.current_condition]
        
  if (this_condition == "ai") {         
    this_prediction = TOPICDATA.prediction_overall;
    this_confidences = TOPICDATA.confidences.overall;
  }
  if (this_condition == "attention") {  
    this_prediction = TOPICDATA.prediction_1_4;
    this_confidences = TOPICDATA.confidences.model_1_4;
  }
  if (this_condition == "attribute") {  
    this_prediction = TOPICDATA.prediction_2_3;
    this_confidences = TOPICDATA.confidences.model_2_3;
  }
  if (this_condition == "expert") {     
    this_prediction = TOPICDATA.prediction_overall;
    this_confidences = TOPICDATA.confidences.overall;
  }else{
    // --------- no-ai
   this_prediction = TOPICDATA.prediction_overall;
   this_confidences = TOPICDATA.confidences.overall; 
  }
  
  if (($("#claimPrediction")[0].classList.contains('closed') == true) & taskRun.flags.mid_survey_2_done & prediction_task_done == false){

    // ------ User Guessing Measure ----------
    var userGuess = prompt("What do you guess about AI's Prediction for This News Headline: (True? or Fake?)", "True? or Fake?");

      if (this_condition != "no-ai" && userGuess == null || userGuess == "" || userGuess == "True? or Fake?") {  // if canceled
            // TopicPage.canceledGuessing();

            axios.post('/log/', {
                action: "cancelUserGuess",
                info: {
                  topic: TOPICDATA.claim_id,
                  credibility: TOPICDATA.credibility,
                  prediction: this_prediction,
                  confidences: this_confidences,
                  timestamp: unix
                }
              }
            );

      } else {    // if answered

          let opened = Visuals.toggleOpenClosed($("#claimPrediction")[0])
          
          // console.log(userGuess);

          axios.post('/log/', {
                action: "userGuess",
                info: {
                  topic: TOPICDATA.claim_id,
                  guess: userGuess,
                  credibility: TOPICDATA.credibility,
                  prediction: this_prediction,
                  confidences: this_confidences,
                  timestamp: unix
                }
              }
            );

          prediction_task_done = true; 
          // taskRun.save();

          if(opened) {
            axios.post('/log/', {
                action: "show-claimPrediction",
                info: {
                  topic: TOPICDATA.claim_id,
                  credibility: TOPICDATA.credibility,
                  prediction: this_prediction,
                  confidences: this_confidences,
                  timestamp: unix
                }
              }
            );
          } else {
            axios.post('/log/', {
                action: "hide-claimPrediction",
                info: {
                  topic: TOPICDATA.claim_id,
                  credibility: TOPICDATA.credibility,
                  prediction: this_prediction,
                  confidences: this_confidences,
                  timestamp: unix
                }
              }
            );
          }
      }
  } else {

    // ------------- Not doing Prediction Task -------------
    let opened = Visuals.toggleOpenClosed($("#claimPrediction")[0])
        if(opened) {
            axios.post('/log/', {
                action: "show-claimPrediction",
                info: {
                  topic: TOPICDATA.claim_id,
                  credibility: TOPICDATA.credibility,
                  prediction: this_prediction,
                  confidences: this_confidences,
                  timestamp: unix
                }
              }
            );
          } else {
            axios.post('/log/', {
                action: "hide-claimPrediction",
                info: {
                  topic: TOPICDATA.claim_id,
                  credibility: TOPICDATA.credibility,
                  prediction: this_prediction,
                  confidences: this_confidences,
                  timestamp: unix
                }
              }
            );
          }
  }
}


TopicPage.toggleClaimConfidences = function() {
  
  var unix = Math.round(+new Date()/1000);

  this_condition = taskRun.condition_order[taskRun.current_condition]
        
  if (this_condition == "ai") {         
    this_prediction = TOPICDATA.prediction_overall;
    this_confidences = TOPICDATA.confidences.overall;
  }
  if (this_condition == "attention") {  
    this_prediction = TOPICDATA.prediction_1_4;
    this_confidences = TOPICDATA.confidences.model_1_4;
  }
  if (this_condition == "attribute") {  
    this_prediction = TOPICDATA.prediction_2_3;
    this_confidences = TOPICDATA.confidences.model_2_3;
  }
  if (this_condition == "expert") {     
    this_prediction = TOPICDATA.prediction_overall;
    this_confidences = TOPICDATA.confidences.overall;
  }else{
    // --------- no-ai
   this_prediction = TOPICDATA.prediction_overall;
   this_confidences = TOPICDATA.confidences.overall; 
  }
  
  if (($("#claimConfidences")[0].classList.contains('closed') == true) & taskRun.flags.mid_survey_2_done & prediction_task_done == false){

    // ------ User Guessing Measure ----------
    var userGuess = prompt("What do you guess about AI's Prediction for This News Headline: (True? or Fake?)", "True? or Fake?");

      // if canceled
      if (this_condition != "no-ai" && userGuess == null || userGuess == "" || userGuess == "True? or Fake?") {  

            axios.post('/log/', {
                action: "cancelUserGuess",
                info: {
                  topic: TOPICDATA.claim_id,
                  timestamp: unix
                }
              }
            );

      } else {    // if answered

          
          prediction_task_done = true; 

          axios.post('/log/', {
                action: "userGuess",
                info: {
                  topic: TOPICDATA.claim_id,
                  guess: userGuess,
                  timestamp: unix
                }
              }
            );


          let opened = Visuals.toggleOpenClosed($("#claimConfidences")[0])
          if(opened) {
            axios.post('/log/', {
                action: "show-claimConfidences",
                info: {
                  topic: TOPICDATA.claim_id,
                  timestamp: unix
                }
              }
            );
          } else {
            axios.post('/log/', {
                action: "hide-claimConfidences",
                info: {
                  topic: TOPICDATA.claim_id,
                  timestamp: unix
                }
              }
            );
          }
      }
  } else {

    // ------------- Not doing Prediction Task -------------
          let opened = Visuals.toggleOpenClosed($("#claimConfidences")[0])
          if(opened) {
            axios.post('/log/', {
                action: "show-claimConfidences",
                info: {
                  topic: TOPICDATA.claim_id,
                  timestamp: unix
                }
              }
            );
          } else {
            axios.post('/log/', {
                action: "hide-claimConfidences",
                info: {
                  topic: TOPICDATA.claim_id,
                  timestamp: unix
                }
              }
            );
          }

  }
  
  // --- old --- 
  // if(opened) {
  //   axios.post('/log/', {
  //       action: "show-claimConfidences",
  //       info: {
  //         topic: TOPICDATA.claim_id,
  //         timestamp: unix
  //       }
  //     }
  //   );
  // } else {
  //   axios.post('/log/', {
  //       action: "hide-claimConfidences",
  //       info: {
  //         topic: TOPICDATA.claim_id,
  //         timestamp: unix
  //       }
  //     }
  //   );
  // }


}

//  --- toggle claim highlights ----
TopicPage.toggleClaimWords = function()
{
  let title = $("#claimHeader")[0]
  let switchInput = $('#claimWordsSwitch')[0]
  var unix = Math.round(+new Date()/1000);

  if(title.classList.contains('highlight-off'))
  {
    title.classList.remove('highlight-off')
    title.classList.add('highlight-on')
    switchInput.checked = true;
  }
  else
  {
    title.classList.remove('highlight-on')
    title.classList.add('highlight-off')
    switchInput.checked = false;
  }

  if(switchInput.checked) {
    axios.post('/log/', {
        action: "show-claimWords",
        info: {
          topic: TOPICDATA.claim_id,
          timestamp: unix
        }
      }
    );
  } else {
    axios.post('/log/', {
        action: "hide-claimWords",
        info: {
          topic: TOPICDATA.claim_id,
          timestamp: unix
        }
      }
    );
  }
}

TopicPage.addTopicWordHighlights = function() {
  let title = $("#claimHeader")[0];

  title.innerHTML = "";
  for(let attention of TOPICDATA.claim_attentions)
  {
    let word = document.createElement('span');
        word.innerText = attention.phrase;
        word.className = 'highlit-word';
        // console.log(attention);
    let amount = Math.round(parseFloat(attention.attention) * 100)
    word.dataset.amount = amount;

    word.style.textDecorationColor = "rgba(98, 200, 165, 0)"
    //word.style.backgroundColor = "rgba(46, 121, 182, "+Math.pow(amount / 100, 0.4)+")"

    if(amount > 1)
    {

      word.style.textDecorationColor = "rgba(98, 200, 165, "+Math.pow(amount / 100, 0.4)+")"
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

    title.appendChild(word);
    //title.appendChild(space);
  }

  title.style.opacity = 1;

}