process.env.NODE_ENV = 'dev'
const Topic = require('../models/Topic');
const Article = require('../models/Article');
const mongoose = require('mongoose')
const config = require('config')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

const randomPrediction = () => {
  return ["True", "Mostly True", "Mostly False", "False"]
          [Math.floor(Math.random() * Math.floor(4))]
}

const randomConfidence = () => {
  // 0.5 - 0.99
  return 0.499999 + (Math.random() * 0.5);
}

const randomAttention = () => {
  return Math.pow(Math.random(), 10);
}

const randomImportance = () => {
  return Math.random()
}

const chooseRandom = (choices, toChoose) => {
  let chosen = []
  while(chosen.length < toChoose && chosen.length < (choices.length / 2))
  {
    let maybeChoice = Math.floor(Math.random() * Math.floor(choices.length))
    if(chosen.indexOf(maybeChoice) == -1)
      chosen.push(maybeChoice)
  }
  let myChoices = []
  for(let i of chosen){
    myChoices.push(choices[i])
  }
  return myChoices
}

const addFakeOutputs_Topic = async (topicId) => {
  let topic = await Topic.findOne({claim_id : topicId});

  // topic fields
  let attentions = []
  let words = topic.claim.split(' ')
  for(let word of words) {
    attentions.push({
      phrase : word,
      attention : randomAttention()
    })
  }
  topic.claim_attentions = attentions;

  topic.confidences = {
    model_1 : randomConfidence(),
    model_2 : randomConfidence(),
    model_3 : randomConfidence(),
    model_4 : randomConfidence(),
    overall : randomConfidence()
  }
  topic.prediction = randomPrediction()
/*
  // articles
  for(let article of topic.articles) {
    await addFakeOutputs_Article(article._id)
  }
*/
  await topic.save()
}

const addFakeOutputs_Article = async (articleId) => {
  //console.log("add fakes for article:", articleId)
  let article = await Article.findOne({_id: articleId})

  // imporantances
  article.importance = {
    article : randomImportance(),
    article_source : randomImportance(),
    claim : randomImportance(),
    claim_source : randomImportance()
  }

  // top top_sentences
  let top = []
  let sentences = article.text.split('.')
  if(sentences.length > 1) {
    article.top_sentences = chooseRandom(sentences, 3)
  }

  // attentions
  let attentions = []
  let words = article.text.split(' ')
  for(let word of words) {
    attentions.push(
      randomAttention()
    )
  }
  article.attentions = attentions;

  await article.save()
}

const run = async() => {
  try {
    await mongoose.connect(config.database.connectionString, { useNewUrlParser : true })

    let allTopics = await Topic.find({}).select('claim_id').lean()
    console.log("Topic Count: ", allTopics.length)
    let topicIds = allTopics.map(m => m.claim_id)
    console.log("Topic IDs: ", topicIds.length)
    delete allTopics

    let completed = 0
    for(let id of topicIds) {
      await addFakeOutputs_Topic(id)
      completed++
      if(completed % 200 == 0)
        console.log("Completed: ", completed)
    }
    console.log("All Done");
    return;
  } catch (err) {
      console.log(err)
  }
  process.exit()
}

run();
