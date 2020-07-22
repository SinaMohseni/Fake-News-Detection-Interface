function init()
{
  updateSelections(taskRun)

  showHideConditionals(taskRun.condition_order[taskRun.current_condition])

  addWordHighlights()

  fixFancyNumbers()
  addNumberDescriptions()

  // for testing Only
  //showHideConditionals("expert")
}

function showHideConditionals(condition)
{
  // should be hidden by default
  hide('.lvl-one')
  hide('.lvl-two')
  hide('.lvl-three')

  if(condition == "ai") {
    show('.lvl-one')
  }
  if(condition == "intermediate") {
    show('.lvl-one')
    show('.lvl-two')
  }
  if(condition == "expert") {
    show('.lvl-one')
    show('.lvl-two')
    show('.lvl-three')
  }
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

function interpolateColor(color1, color2, factor) {
  if (arguments.length < 3) { factor = 0.5; }
  var result = color1.slice();
  for (var i=0;i<3;i++) {
    result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
  }
  return result;
};

function inspectArticle(event)
{
  let articleId = event.target.dataset.article_id;

  // TODO - log this

  window.location = "/study/topic/" + TOPICDATA.claim_id + '/' + articleId
}

function chooseArticle(event)
{
  console.log("choosing", event.target.dataset.article_id);
  if(event.target.innerHTML == "Select")
  {
    // TODO - log this

    axios.post('/chooseArticle/', {
        article: event.target.dataset.article_id
      }
    ).then(res => {
      if(res.status == 200)
      {
        updateSelections(res.data);
      }
    });
  }
  else
  {
    // TODO - log this

    axios.post('/removeArticle/', {
        article: event.target.dataset.article_id
      }
    ).then(res => {
      if(res.status == 200)
      {
        updateSelections(res.data);
      }
    });
  }
}

function updateSelections(sess)
{
  //console.log(sess)
  //$('#feedCount').text(parseInt($('#feedCount').text()) + n)

  $('#taskRunScore')[0].innerText = sess.score
  $('#taskRunCompletion')[0].innerText = sess.completionText

  let chooseButts = $(".choose");
  for(let butt of chooseButts) {
    butt.parentElement.parentElement.classList.remove('selected')
    butt.innerHTML = "Select";

    if(sess.chosen_articles.indexOf(butt.dataset.article_id) != -1) {
      butt.innerHTML = "Unselect";
      butt.parentElement.parentElement.classList.add('selected')
      console.log('found a selected article')
    }
  }
  maybeShowSurvey(sess)
}

function fixFancyNumbers()
{
  let fancyNums = $('.fancy-number');
  for(let num of fancyNums) {
    let n = Math.round(parseFloat(num.innerHTML) * 100)
    //console.log(n);
    // round the number
    num.innerText = n + '%'
    num.dataset.numValue = n;

    let color = interpolateColor( [179, 42, 37], [35, 173, 101], n/100 )
    num.style.backgroundColor =
      "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")"
  }
}

function colorText()
{
  let predicitonTexts = $('.true-false-text');

  for(let text of predicitonTexts)
  {
    text.style.backgroundColor = getGoodColor(text.innerHTML)
  }
}

function getGoodColor(cred)
{
  switch(cred){
    case "True": return "#23ad65";
    case "Mostly True": return "#72ad3a";
    case "Mostly False": return "#b36b25";
    case "False" : return "#b32a25";
  }
  return "white";
}

function addNumberDescriptions()
{
  let numDescriptions = $('.number-description');
  for(let desc of numDescriptions) {
    let value = desc.previousSibling.dataset.numValue;

    //console.log(desc.classList)
    //console.log(value)

    let text = 'maybe something'

    if(desc.classList[1] == 'article-relevance')
      text = percentageDescription(value, 'relevant')
    if(desc.classList[1] == 'article-importance')
      text = percentageDescription_GreatToHorrible(value, 'quality')
    if(desc.classList[1] == 'source-credibility')
      text = percentageDescription(value, 'credible')
    if(desc.classList[1] == 'source-relevance')
      text = percentageDescription(value, 'relevant')

    desc.innerText = text;
  }
}

function percentageDescription(value, attribute)
{
  if(value >= 90) return "Highly " + attribute;

  if(value >= 80) return "Very " + attribute;

  if(value >= 70) return  attribute[0].toUpperCase() + attribute.slice(1);

  if(value >= 60) return "Somewhat " + attribute;

  if(value >= 50) return "Just a little " + attribute;

  if(value >= 40) return "Barely " + attribute;

  if(value >= 30) return "Possibly " + attribute;

  if(value >= 20) return "Not " + attribute;

  return "Not "+attribute+" at all";
}

function percentageDescription_GreatToHorrible(value, attribute)
{
  if(value >= 90) return "Great " + attribute;

  if(value >= 80) return "Very good " + attribute;

  if(value >= 70) return  "Good " + attribute;

  if(value >= 60) return "OK " + attribute;

  if(value >= 50) return "So-so " + attribute;

  if(value >= 40) return "Questionable " + attribute;

  if(value >= 30) return "Not very good " + attribute;

  if(value >= 20) return "Bad " + attribute;

  return "Horrible " + attribute;
}

function toggleExplainable(event)
{
  let explainable = event.target;
  while(!explainable.classList.contains('article-explainable'))
  {
    explainable = explainable.parentElement
  }

  let opened = toggleOpenClosed(explainable)

  // TODO log this
  //console.log(explainable.dataset.explainable + " | "+ explainable.dataset.articleid)
}

function toggleTopSentences()
{
  let opened = toggleOpenClosed($("#topSentences")[0])

  // TODO log this
}

function toggleOpenClosed(element)
{
  if(element.classList.contains('closed'))
  {
    element.classList.remove('closed')
    element.classList.add('open')
    return true
  }
  else
  {
    element.classList.remove('open')
    element.classList.add('closed')
    return false
  }
  return false
}

function toggleArticleWords()
{
  let title = $("#articleText")[0]
  let switchInput = $('#articleWordsSwitch')[0]
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

  // TODO log this
}

function addWordHighlights()
{
  let text = $("#articleText")[0];

  text.innerText = ""

  let words = articleDATA.text.split(' ')

  //console.log(words.length +" vs "+ articleDATA.attentions.length)
  let minLength = 0;
  if(words.length < articleDATA.attentions.length)
  {
    minLength = words.length
  }
  else {
    minLength = articleDATA.attentions.length
  }

  for(let i = 0; i < minLength; i++)
  {
    let w = words[i];
    let attention = articleDATA.attentions[i];

    let word = document.createElement('span');
        word.innerText = w;
        word.className = 'highlit-word';

    let amount = Math.round(parseFloat(attention) * 100)
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

    text.appendChild(word);
    text.appendChild(space);
  }

  text.style.opacity = 1;
}
