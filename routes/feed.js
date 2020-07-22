const TaskRun = require('../models/TaskRun')
const Article = require('../models/Article')
const Topic = require('../models/Topic')

const articlesForTopic = (articles, topic) => {
  for(let article of articles) {
    if(article.topic._id.equals(topic._id))
      return article
  }
  return null;
}

const feed = {}

feed.render = async (req, res) => {
  /*
  let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id}).populate({
     path: 'chosen_articles',
     populate: {
       path: 'chosen_articles.topic'
     }
  })
  */
  let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id}).populate('chosen_articles chosen_articles.topic')
  //console.log(taskRun.chosen_articles[0].topic);

  // organize by topics
  let topics = new Map()
  for(let article of taskRun.chosen_articles) {

    if(topics.has(article.topic._id)) {
      topics.get(article.topic._id).selected_articles.push(article)
    }
    else {
      let topic = await Topic.findOne({_id: article.topic}).lean()
      topic.selected_articles = []
      topics.set(article.topic._id, topic)
      topics.get(article.topic._id).selected_articles.push(article)
    }
  }


  let studyText = {
    browseInfo: "Explore a news story.",
    completionInfo: "Complete the task to continue.",
    browseAction: "Explore",
    articlesLabel : "Relevant Articles: "
  }
  taskRun.completionText = "Unknown"
  taskRun.is_done = false

  if(taskRun.studyType == "bestStudy") {
    studyText.browseInfo = "Examine the articles for each news story and choose the one which you thinks is the most accurate. "
      + "Each news story is given a \'Reader Score\' which estimates how much the readers are interested in that particular story. "
      + "If you choose a good article for that story you can earn extra points for your task."
    studyText.browseAction = ""
    studyText.articlesLabel = "Relevant Articles: "
    studyText.completionInfo = "Choose articles for atleast 6 of the 8 news stories to complete the task."
    taskRun.completionText = taskRun.chosen_articles.length + " of 6 articles selected"

    if(taskRun.chosen_articles.length >= 6) taskRun.is_done = true
  }

  //console.log(topics.keys())
  //console.log(topics.values())
  res.render('study/feed', {
    taskRun: taskRun,
    title: "Selected Articles",
    study: studyText,
    selectedTopics: Array.from(topics.values())})
}

feed.choose = async (req, res) => {
  console.log("choose article")
  let {article} = req.body
  //console.log(articleId)
  if (req.session.taskRun_id != null){
    let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id}).populate('chosen_articles')

    if(taskRun.studyType == "bestStudy")
    {
      article = await Article.findOne({_id: article}).populate('topic')
      //console.log(article)

      // find article for this topic
      let selectedArticle = articlesForTopic(taskRun.chosen_articles, article.topic)

      if(selectedArticle == null) {
        // no selected article for this topic, add
        taskRun.chosen_articles.push(article)
        taskRun.score += article.topic.editorial_score
      }
      else {
        console.log("already had selected an article for this topic, removing it")
        taskRun.chosen_articles.remove(selectedArticle);
        taskRun.chosen_articles.push(article)
      }

      await taskRun.save()

      taskRun.completionText = taskRun.chosen_articles.length + " of 6 articles selected"
      taskRun.chosen_articles = taskRun.chosen_articles.map(a => a._id)

      taskRun.is_done = false

      if(taskRun.chosen_articles.length >= 6) taskRun.is_done = true

      // check if its time for a pop up survey
      // after 2, after 4
      if(taskRun.chosen_articles.length >= 2 && taskRun.flags.mid_study_one == false) {
        taskRun.show_survey = 'mid_study_one'
      }
      else if(taskRun.chosen_articles.length >= 4 && taskRun.flags.mid_study_two == false) {
        taskRun.show_survey = 'mid_study_two'
      }

      res.send(taskRun)
    }
    else if(taskRun.studyType == "trueNewsSelectionStudy")  // curatorStudy
    {
      if(taskRun.chosen_articles.indexOf(article) == -1)
      {
        taskRun.chosen_articles.push(article);
      }

      await taskRun.save()

      taskRun.completionText = taskRun.chosen_articles.length + " articles selected"
      taskRun.chosen_articles = taskRun.chosen_articles.map(a => a._id)

      taskRun.is_done = false

      if(taskRun.chosen_articles.length >= 12) taskRun.is_done = true

      // check if its time for a pop up survey
      // after 2, after 4
      if(taskRun.chosen_articles.length >= 2 && taskRun.flags.mid_study_one == false) {
        taskRun.show_survey = 'mid_study_one'
      }
      else if(taskRun.chosen_articles.length >= 4 && taskRun.flags.mid_study_two == false) {
        taskRun.show_survey = 'mid_study_two'
      }

      res.send(taskRun)
    }


  }
  else {
    res.send("choose article - no taskRun, whoops")
  }
}

feed.remove = async (req, res) => {
  console.log("remove article")
  let {article} = req.body
  if (req.session.taskRun_id != null){
    let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id}).populate('chosen_articles')

    if(taskRun.studyType == "bestStudy") {

      article = await Article.findOne({_id: article}).populate('topic')

      // find article for this topic
      let selectedArticle = articlesForTopic(taskRun.chosen_articles, article.topic)
      if(selectedArticle._id.equals(article._id))
      {
        console.log('removing the selected article, nice')
        taskRun.score -= article.topic.editorial_score
      }
      taskRun.chosen_articles.remove(article);
      taskRun.completionText = taskRun.chosen_articles.length + " of 6 articles selected"
    }
    else if(taskRun.studyType == "trueNewsSelectionStudy")  // curatorStudy
    {
      //article = await Article.findOne({_id: article}).populate('topic')
      taskRun.chosen_articles.remove(article);
      taskRun.completionText = taskRun.chosen_articles.length + " articles selected"
    }

    await taskRun.save()
    res.send(taskRun)
  }
  else {
    res.send("remove article - no taskRun, whoops")
  }
}

module.exports = feed
