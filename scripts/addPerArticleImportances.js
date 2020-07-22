process.env.NODE_ENV = 'dev'
const Topic = require('../models/Topic');
const Article = require('../models/Article');
const mongoose = require('mongoose')
const config = require('config')

const randomImportance = () => {
  return Math.random()
}

const addFakeOutputs_Topic = async (topicId) => {
  let topic = await Topic.findOne({claim_id : topicId});

  // articles
  for(let article of topic.articles) {
    await addFakeOutputs_Article(article._id)
  }
}

const addFakeOutputs_Article = async (articleId) => {
  //console.log("add fakes for article:", articleId)
  let article = await Article.findOne({_id: articleId})

  // imporantances
  article.overall_importance = randomImportance()

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
