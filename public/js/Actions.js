const Actions = {}


Actions.updateSelections = function(sess) {

    let chosenArticleIds = []

    if(sess.chosen_articles.length > 0) {
        if(sess.chosen_articles[0]._id != null){
            for(let article of sess.chosen_articles) {
                chosenArticleIds.push(article._id)
            }
        } else{
            chosenArticleIds = sess.chosen_articles
        }
    }

    let selectedForThisTopic = 0

    let chooseButts = $(".choose")
    for(let butt of chooseButts) {
        butt.parentElement.parentElement.classList.remove('selected')
        butt.innerHTML = "Select"
        // console.log(chosenArticleIds.indexOf(butt.dataset.article_id))
        if(chosenArticleIds.indexOf(butt.dataset.article_id) != -1) {
            butt.innerHTML = "Unselect"
            selectedForThisTopic++
            butt.parentElement.parentElement.classList.add('selected')
        }
    }

    if($("#continueButton").length == 1) {
        if(selectedForThisTopic >= 1) {
            // enable Continue button
            $("#continueButton")[0].classList.remove('disabled')
            $("#skipButton")[0].classList.add('disabled')
        } else {
            $("#continueButton")[0].classList.add('disabled')
            $("#skipButton")[0].classList.remove('disabled')
        }
    }
}

Actions.inspectArticle = function(event) {
  let articleId = event.target.dataset.article_id;
  window.location = "/study/topic/" + TOPICDATA.claim_id + '/' + articleId
}


Actions.skipStory = function(event) {
    // console.log("selecting", event.target.dataset.article_id);
  var unix = Math.round(+new Date()/1000);


        this_condition = taskRun.condition_order[taskRun.current_condition]
        
        // console.log('----------this_condition :', this_condition, TOPICDATA.prediction_overall,TOPICDATA.prediction_1_4, TOPICDATA.prediction_2_3)

        if (this_condition == "ai") {         
          this_prediction = TOPICDATA.prediction_overall;
          this_confidences = TOPICDATA.confidences.overall;
          // this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_overall')
          // this_p = (this_p.prediction_overall == 'True') ? 1 : 0;
          // Visuals.show('.lvl-one')
        }
        if (this_condition == "attention") {  
          this_prediction = TOPICDATA.prediction_1_4;
          this_confidences = TOPICDATA.confidences.model_1_4;
          // this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_1_4')
          // this_p = (this_p.prediction_1_4 == 'True') ? 1 : 0;
          // Visuals.show('.lvl-two')
        }
        if (this_condition == "attribute") {  
          this_prediction = TOPICDATA.prediction_2_3;
          this_confidences = TOPICDATA.confidences.model_2_3;
          // this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_2_3')
          // this_p = (this_p.prediction_2_3 == 'True') ? 1 : 0;
          // Visuals.show('.lvl-three')
        }
        if (this_condition == "expert") {     
          this_prediction = TOPICDATA.prediction_overall;
          this_confidences = TOPICDATA.confidences.overall;
          // this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_overall')
          // this_p = (this_p.prediction_overall == 'True') ? 1 : 0;
          // Visuals.show('.lvl-four')
        
        }else{ 
         // ---------------  no-ai
         this_prediction = TOPICDATA.prediction_overall;
         this_confidences = TOPICDATA.confidences.overall; 
        }


    axios.post('/log/', {
        action: "skippedStory",
        info: {
            claim_id: TOPICDATA.claim_id,
            credibility: TOPICDATA.credibility,
            prediction: this_prediction,
            confidences: this_confidences,
            timestamp: unix
        }
        }
      );

    window.location = "/study/next/skipped"

  }


  Actions.selectStory = function(event) {
    // console.log("selecting", event.target.dataset.article_id);
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
         this_prediction = TOPICDATA.prediction_overall;
          this_confidences = TOPICDATA.confidences.overall; 
        }


    // ------ User Guessing Measure ----------
    if (this_condition != "no-ai" && taskRun.flags.mid_survey_2_done && prediction_task_done == false){

      var userGuess = prompt("What do you guess about AI's Prediction for This News Headline: (True? or Fake?)", "True? or Fake?");

      if (userGuess == null || userGuess == "" || userGuess == "True? or Fake?") {  // if canceled
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

          axios.post('/log/', {
              action: "userGuess",
              info: {
                  claim_id: TOPICDATA.claim_id,
                  guess: userGuess,
                  credibility: TOPICDATA.credibility,
                  prediction: this_prediction,
                  confidences: this_confidences,
                  timestamp: unix
              }
            }
          );


          axios.post('/log/', {
              action: "selectedStory",
              info: {
                  claim_id: TOPICDATA.claim_id,
                  credibility: TOPICDATA.credibility,
                  prediction: this_prediction,
                  confidences: this_confidences,
                  timestamp: unix
              }
            }
          );
          // prediction_task_done = true;
          window.location = "/study/next/selected"
      }
    
    //  --- No prediction task ---
    }else{

    axios.post('/log/', {
        action: "selectedStory",
        info: {
            claim_id: TOPICDATA.claim_id,
            credibility: TOPICDATA.credibility,
            prediction: this_prediction,
            confidences: this_confidences,
            timestamp: unix
        }
      }
    );

    window.location = "/study/next/selected"

    } 

    

  }

  Actions.reportStory = function(event) {
  // console.log("selecting", event.target.dataset.article_id);
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
         this_prediction = TOPICDATA.prediction_overall;
          this_confidences = TOPICDATA.confidences.overall; 
        }


        // ------ User Guessing Measure ----------
    if (this_condition != "no-ai" && taskRun.flags.mid_survey_2_done && prediction_task_done == false){

      // var userGuess = prompt("Please Guess AI Prediction for this News Story: (True? or Fake?)", "");
      var userGuess = prompt("What do you guess about AI's Prediction for This News Headline: (True? or Fake?)", "True? or Fake?");


      if (userGuess == null || userGuess == "" || userGuess == "True? or Fake?") {  // if canceled
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

            axios.post('/log/', {
                action: "userGuess",
                info: {
                    claim_id: TOPICDATA.claim_id,
                    guess: userGuess,
                    credibility: TOPICDATA.credibility,
                    prediction: this_prediction,
                    confidences: this_confidences,
                    timestamp: unix
                }
              }
            );

            axios.post('/log/', {
              action: "reportStory",
              info: {
                  claim_id: TOPICDATA.claim_id,
                  credibility: TOPICDATA.credibility,
                  prediction: this_prediction,
                  confidences: this_confidences,
                  timestamp: unix
              }
            }
          );

          window.location = "/study/next/skipped"

          }
      

      }else{
        //  If No prediction task
          axios.post('/log/', {
              action: "reportStory",
              info: {
                  claim_id: TOPICDATA.claim_id,
                  credibility: TOPICDATA.credibility,
                  prediction: this_prediction,
                  confidences: this_confidences,
                  timestamp: unix
              }
            }
          );

          window.location = "/study/next/skipped"

      }

  }


Actions.chooseArticle = function(event) {
  
  // console.log(event.target.innerHTML)

  var unix = Math.round(+new Date()/1000);

  if(event.target.innerHTML == "Select")
  {
    axios.post('/log/', {
        action: "selectArticle",
        info: {
            topic: TOPICDATA.claim_id,
            article: event.target.dataset.article_id,
            timestamp: unix
        }
      }
    );

    // console.log("selecting", event.target.dataset.article_id);
    axios.post('/chooseArticle/', {
        article: event.target.dataset.article_id
      }
    ).then(res => {
      if(res.status == 200)
      {
        Actions.updateSelections(res.data);
      }
    });
  }
  else
  {
    
    axios.post('/log/', {
        action: "removeArticle",
        info: {
            topic: TOPICDATA.claim_id,
            article: event.target.dataset.article_id,
            timestamp: unix
        }
      }
    );
    // console.log("Unselecting", event.target.dataset.article_id);
    axios.post('/removeArticle/', {
        article: event.target.dataset.article_id
      }
    ).then(res => {
      if(res.status == 200)
      {
        Actions.updateSelections(res.data);
      }
    });
  }
}
