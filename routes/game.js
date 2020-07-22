const Topic = require('../models/Topic')
const Article = require('../models/Article')
const TaskRun = require('../models/TaskRun')
const axios = require('axios')
const extractor = require('unfluff')
const shortid = require('shortid')


const setupNewGame = async (taskRun, type, conditionType) => {

  taskRun.studyType = type

  taskRun.score = 0
  taskRun.game_stats.plays = 0
  taskRun.game_stats.correct = 0

  taskRun.game_stats.condition = conditionType

  if(conditionType == 'random') {
    taskRun.game_stats.condition = ["basic", "simple", "intermediate", "expert"]
        [ Math.floor(Math.random() * Math.floor(4))]
  }
  await taskRun.save()
}

const game = {}

game.renderIntro = async (req, res) => {

  const gameType = req.params.gameType
  const gameCondition = req.params.gameCondition

  let taskRun;

  if (req.session.taskRun_id != null) {
    console.log("i already know you: "+req.session.participant_id)
    taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})

    // check for prior game condition
    if(taskRun.game_stats.condition == null || taskRun.game_stats.condition == "") {
      // start new game
      setupNewGame(taskRun, gameType, gameCondition)
    }
  } else {

    // create a new taskRun
    taskRun = new TaskRun({
      participant_id : shortid.generate(),
    })
    setupNewGame(taskRun, gameType, gameCondition)
  }

  req.session.taskRun_id = taskRun._id
  req.session.participant_id = taskRun.participant_id
  //console.log(req.session);
  console.log('welcome to the game: '+req.session.participant_id)

  let descript = "In this game you'll be shown a news story headline and 1 related new article about "

  res.render('game/intro', {taskRun: taskRun, title: "True or False", description: descript})
}

game.renderGame_TrueOrFake = async (req, res) => {

  const gameType = req.params.gameType
  const gameCondition = req.params.gameCondition

  if (req.session.taskRun_id == null) {
    res.redirect('/')
  }
  let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})

  // find random article
  let allTopics = await Topic.find({nicOK: true}).select('articles').lean()

  // choose a random topic
  let randomTopic = allTopics[Math.floor(Math.random()*allTopics.length)];
  //randomTopic = await Topic.findOne({_id: randomTopic._id});
  console.log(randomTopic)
  let randomArticle = await Article.findOne(randomTopic.articles[Math.floor(Math.random()*randomTopic.articles.length)]).populate('topic').lean()

  if(randomArticle.unfluffed == null)
  {
    try {
      const response = await axios.get(randomArticle.link);
      const siteData = extractor(response.data);
      randomArticle.unfluffed = siteData;
      randomArticle.save();
    } catch(e) {console.error(e)};
  }

  res.render('game/game', {taskRun: taskRun, article: randomArticle})
}

game.guess = async (req, res) => {
  //console.log("guessing")
  //console.log(req.body);
  const {articleID, guess} = req.body
  if (req.session.taskRun_id != null){
    let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})
    let article = await Article.findOne({_id: articleID}).populate('topic')
    let articleCred = false;
    if(article.topic.credibility == "true"
      || article.topic.credibility == "mostly true")
      articleCred = true;

    if(!taskRun.score)
      taskRun.score = 0;

    if(guess == articleCred)
    {
      taskRun.score++
      await taskRun.save()
      res.send({taskRun: taskRun, correct: true})
    }
    else {
      taskRun.score--
      await taskRun.save()
      res.send({taskRun: taskRun, correct: false})
    }
  }
  else {
    res.send("guessing - no taskRun, whoops")
  }
}


game.renderGame_TwoFakes = async (req, res) => {
  let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})

  // find random article
  let allTopics = await Topic.find({nicOK: true}).select('articles')

  // choose a random topic
  let randomTopic = allTopics[Math.floor(Math.random()*allTopics.length)];
  randomTopic = await Topic.findOne({_id: randomTopic._id});
  //console.log(randomTopic)
  let randomArticle = await Article.findOne(randomTopic.articles[Math.floor(Math.random()*randomTopic.articles.length)])

  if(randomArticle.unfluffed == null)
  {
    try {
      const response = await axios.get(randomArticle.link);
      const siteData = extractor(response.data);
      randomArticle.unfluffed = siteData;
      randomArticle.save();
    } catch(e) {console.error(e)};
  }

  res.render('game', {taskRun: taskRun, title: "Game", topic : randomTopic, article: randomArticle})
}

module.exports = game
