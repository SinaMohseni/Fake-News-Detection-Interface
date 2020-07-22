function init()
{
  updateSelections()
  updateTopBar(taskRun)
}

function updateSelections()
{
  //console.log(taskRun);

  // change colors of the completed ones
  let topicRows = $('.topic-row')
  let cirlceImages = $('.topic-row .circle img')
  let circleTexts = $('.topic-row .lil-circle-text')

  for(let i = 0; i < topicRows.length; i++) {
    let row = topicRows[i]
    row.classList.remove('complete')
    cirlceImages[i].src = "/img/baseline-search-24px.svg";

    let selectedArticles = articlesForTopic(taskRun.chosen_articles, row.dataset.id)

    let max = '?';
    if(taskRun.studyType == "bestStudy") {
      max = '1'
      if(selectedArticles.length == 1)
      {
        cirlceImages[i].src = "/img/baseline-check-24px.svg";
        row.classList.add('complete')
      }
    }
    circleTexts[i].innerText = selectedArticles.length + " of " + max

  }
}

function articlesForTopic(articles, topicId)
{
  let arts = []
  for(let a of articles) {
    //console.log(a.topic + " "+topicId)
    if(a.topic == topicId)
      arts.push(a)
  }
  return arts;
}

function removeArticle(event)
{
  axios.post('/removeArticle/', {
        article: event.target.dataset.article_id
      }
    ).then(res => {
      let articleBox = event.target.parentElement.parentElement
      let articleList = articleBox.parentElement

      articleList.removeChild(articleBox);

      if(articleList.children.length == 1)
      {
        // remove the whole topic
        articleList.parentElement.parentElement.removeChild(articleList.parentElement)
      }

      updateTopBar(res.data)

    });
}

function updateTopBar(task)
{
  //console.log(sess)
  //$('#feedCount').text(parseInt($('#feedCount').text()) + n)

  $('#taskRunScore')[0].innerText = sess.score
  $('#taskRunCompletion')[0].innerText = sess.completionText

  if(sess.is_done) {
    show('#completeButton')
  }
  else{
    hide('#completeButton')
  }

  taskRun = task;
}


function inspectArticle(event)
{
  let articleId = event.target.dataset.article_id;

console.log(event.target.dataset)
  // TODO - log this

  window.location = "/study/topic/" + event.target.dataset.topic_id + '/' + articleId
}

function attemptToFinish()
{
  if(taskRun.is_done)
  {
    window.location = "/complete"
  }
}

function closeScore()
{
  hide('#finalScore')
  show('#conditionComplete')
}


function attemptToCompleteCondition()
{
  let how = $("input[name='how']:checked").val();
  let help = $("input[name='help']:checked").val();

  var unix = Math.round(+new Date()/1000);

  if(how && help)
  {
    axios.post('/log/', {
        action: "survey - post_condition",
        info: {
            how: how,
            help: help,
            timestamp: unix
        }
      }
    );
    axios.post('/studyEvent', {
        action: "post_condition",
      }
    );
    hide('#conditionComplete')

    if(taskRun.current_condition + 1 == taskRun.condition_order.length)
    {
      // must be all done
      show('#studyComplete')
    }
    else {
      // move on to next condition
      window.location = '/begin/' + taskRun.studyType
    }
  }
  else
  {
     $("#conditionErrorMessage").text("Please answer all the questions.")
  }

}

function attemptToCompleteStudy()
{
  let think = $("input[name='think']:checked").val();
  let tips = $("input[name='tips']:checked").val();
  var unix = Math.round(+new Date()/1000);

  if(think && tips)
  {
    axios.post('/log/', {
        action: "survey - post_study",
        info: {
            think: think,
            tips: tips,
            timestamp: unix
        }
      }
    );
    axios.post('/studyEvent', {
        action: "post_study",
      }
    );
    hide('#studyComplete')
    show('#verification')
  }
  else
  {
     $("#completeErrorMessage").text("Please answer all the questions.")
  }
}
