process.env.NODE_ENV = 'dev'
// process.env.NODE_ENV = 'atlas'

const Topic = require('../models/Topic');
const Article = require('../models/Article');

// const Topic = require('../models/Topic_ood');  // limited to 17 true_fake if (i < 17) 
// const Article = require('../models/Article_ood');

const mongoose = require('mongoose')
const config = require('config')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

const snopesFolder = './xai_snopes/xai_snopes_v2.0/'
// node .\scripts\ingestDataBatch.js .\xai_snopes\batch3

const outputVersion = 0

const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

var total_no_topic = 0


// TODO remove this
const randomAttention = () => {
  return Math.pow(Math.random(), 10);
}


const ingestDataBatch = async(batchFolder) => {

  // let topicsList = await readDir(batchFolder) old

  let topicsListFile1 = await readDir(batchFolder+'/true_true')
  let topicsListFile2 = await readDir(batchFolder+'/true_fake')
  let topicsListFile3 = await readDir(batchFolder+'/fake_true')
  let topicsListFile4 = await readDir(batchFolder+'/fake_fake')
  
  new_topicsListFile = []


  for (i =0; i<25; i++){
    new_topicsListFile.push(batchFolder+'/true_true/'+topicsListFile1[i])
    if (i < 17) new_topicsListFile.push(batchFolder+'/true_fake/'+topicsListFile2[i])
    new_topicsListFile.push(batchFolder+'/fake_true/'+topicsListFile3[i])
    new_topicsListFile.push(batchFolder+'/fake_fake/'+topicsListFile4[i])
  }

  

  // console.log("adding topics from the batch folder: " + topicsList.length)

  let count = 0;
  // for(let topicOutputsFile of topicsList) { old 
  for(let topicOutputsFile of new_topicsListFile) {
    // console.log(batchFolder + '/' + topicOutputsFile)
    // let outputData = await readFile(batchFolder + '/' + topicOutputsFile)  old
    let outputData = await readFile(topicOutputsFile)
    outputData = JSON.parse(outputData)
    let claimId = outputData.claim_id
    count++
    console.log(count+ " " +claimId)

    // while topicsList is not empty
      // check outputData.Credibility
      // mix false and true news

    // add the topic and article data from the snopes dataset
    await ingestSnopesTopicAndArticle(claimId)

    // add the outputs
    await ingestOutputs(outputData)

    // await ingestSnopesArticle(claimId)
  }
}

const ingestSnopesTopicAndArticle = async(topic_id) => {

    let topicData = await readFile(snopesFolder + '/' + topic_id + '.json')
    topicData = JSON.parse(topicData)
    // console.log (topicData)
    let tags = topicData["Tags"].split(';');
    tags = tags.splice(0, tags.length - 1);

    let links = topicData["Referred Links"].split(';');
    links = links.splice(0, links.length - 1);

    let isItGood = false;

    if(topicData["Description"].length > -1 // 10
    && topicData["Last Updated"].length > -1 // 5
    && topicData["Articles_crawled"].length > 0)  // 7
      isItGood = true;

    const t = new Topic({
    // const t = new Topic_ood({
      claim_id : topicData["Claim_ID"],
      claim : topicData["Claim"],
      credibility : topicData["Credibility"],
      description : topicData["Description"],
      example : topicData["Example"],
      fact_check : topicData["Fact Check"],
      last_updated : topicData["Last Updated"],
      originally_published : topicData["Originally Published"],
      origins : topicData["Origins"],
      referred_links : links,
      tags : tags,
      url : topicData["URL"],
      nicOK : isItGood
    })

    // // create articles
    let articles = [];
    let articles_n = topicData["Articles_crawled"].length;


    // reverse order 
    for(let i =0; i<articles_n ; i++) {

      a = topicData["Articles_crawled"][articles_n-1-i]  

      if (a.title.length == 0){
        total_no_topic ++;
        console.log('--- articles with no title: ' + total_no_topic)
        a.title = "."
      }

      let article = new Article({
      // let article = new Article_ood({
        domain : a.domain,
        link : a.link,
        link_type : a.link_type,
        // text : a.text,          // not get article text from the crawled articles anymore 
        title : a.title,
        topic : t._id
      });

      await article.save()
      
      articles.push(article._id);
    }


    t.articles = articles;
    if (isItGood==false) 
      console.log("Broken Input: "+isItGood +" | "+t.nicOK + " Description : " + topicData["Description"].length + " - Last Updated: " + topicData["Last Updated"].length)
    await t.save()
}


const ingestOutputs = async(outputData) => {

  let topic = await Topic.findOne({claim_id : outputData.claim_id});
  // let topic = await Topic_ood.findOne({claim_id : outputData.claim_id});

  topic.output_version = outputVersion

  let attentions = []
  for(let word in outputData.claim_attn) {
    attentions.push({
      phrase : word,
      attention : outputData.claim_attn[word]
    })
  }
  topic.claim_attentions = attentions;
  model_2_3_conf = 0;
  model_1_4_conf = 0;

  // prediction_2_3
  if ((outputData.confidence_model2 + outputData.confidence_model3) > 1) {
    topic.prediction_2_3 = 'Fake';
    model_2_3_conf = (outputData.confidence_model2 + outputData.confidence_model3)/2;
  }else{
    topic.prediction_2_3 = 'True';
    model_2_3_conf = 1.0 - (outputData.confidence_model2 + outputData.confidence_model3)/2;
  }

  // prediction_1_4
  if ((outputData.confidence_model1 + outputData.confidence_model4) > 1) {
    topic.prediction_1_4 = 'Fake';
    model_1_4_conf = (outputData.confidence_model1 + outputData.confidence_model4)/2;
    model_1_clm = outputData.confidence_model1;
    model_4_art = outputData.confidence_model4;
  }else{
    topic.prediction_1_4 = 'True';
    model_1_4_conf = 1.0 - (outputData.confidence_model1 + outputData.confidence_model4)/2;
    model_1_clm = 1.0 - outputData.confidence_model1;
    model_4_art = 1.0 - outputData.confidence_model4;
  }
  // console.log (model_1_4_conf, model_2_3_conf)

  if ((outputData.prediction_overall == 'Mostly True') | (outputData.prediction_overall == 'True')){
    topic.prediction_overall = 'True';
    topic.confidences = {
      model_1 : 1.0 - outputData.confidence_model1,
      model_2 : 1.0 - outputData.confidence_model2,
      model_3 : 1.0 - outputData.confidence_model3,
      model_4 : 1.0 - outputData.confidence_model4,
      model_1_clm : model_1_clm,
      model_4_art : model_4_art,
      model_1_4: model_1_4_conf,
      model_2_3: model_2_3_conf,
      overall : 1.0 - outputData.confidence_overall
    }
  }else if ((outputData.prediction_overall == 'Mostly False') | (outputData.prediction_overall == 'False')){
    topic.prediction_overall = 'Fake';
    prediction_confidence = 
    topic.confidences = {
      model_1 : outputData.confidence_model1,
      model_2 : outputData.confidence_model2,
      model_3 : outputData.confidence_model3,
      model_4 : outputData.confidence_model4,
      model_1_clm : model_1_clm,
      model_4_art : model_4_art,
      model_1_4: model_1_4_conf,
      model_2_3: model_2_3_conf,
      overall : outputData.confidence_overall
    }
  }else{
    console.log('error: unknown prediction_overall ')
  }


  // ------ Sort articles by their relevance -------
  all_articles =[]
  all_relevance =[]
  for(let articleData of outputData.articles) {
    all_articles.push({the_article: articleData, the_relevance: articleData.article_relevance})
    all_relevance.push(articleData.article_relevance)
  }


  all_articles.sort(function(a, b){
    return b.the_relevance-a.the_relevance
  })
  
  normalizer = 1.0 / Math.max(...all_relevance)
  // console.log("max: " )

  // articles
  for(let articleData of all_articles) {
    await addArticleOutputs(articleData,normalizer)
  }

  // -- old: articles
  // for(let articleData of outputData.articles) {
  //   await addArticleOutputs(articleData)
  // }

  await topic.save()
}

const addArticleOutputs = async(articleData_obj,normalizer) => {

  let articleData = articleData_obj.the_article;
  let article = await Article.findOne({link : articleData.link})
  // let article = await Article_ood.findOne({link : articleData.link})

  // old 
  // let article = await Article.findOne({link : articleData.link})

  article.article_relevance = articleData.article_relevance * normalizer
  // console.log(articleData.article_relevance)

  article.importance = {
    article : articleData.imp_article_text,
    article_source : articleData.imp_article_source,
    claim : articleData.imp_claim_text,
    claim_source : articleData.imp_claim_source
  }
  // TODO fix top 3 sents
  article.top_sentences = []
  for(let sent of articleData.top3_sent) {
    //console.log(sent.sentence)
    article.top_sentences.push(sent.sentence)
  }

  // article.text = article_txt;

  await article.save()  

  let attentions = []
  if (articleData.attn_article_scores.length != articleData.attn_article_words.length)
    console.log('-------- article and attention length not equal!!')

  txt_length = articleData.attn_article_scores.length;
  for(let i = 0; i < txt_length; i++){
    attentions.push(
      [articleData.attn_article_words[i], articleData.attn_article_scores[i]]
    )
  }

  article.attentions = attentions;

  // let attentions = []
  // article.attentions = articleData.attn_article_scores;
  // let word_list = []
  // article.word_list = articleData.attn_article_words;

  await article.save()

}


const run = async() => {
  try {
    await mongoose.connect(config.database.connectionString, { useNewUrlParser : true })
    if(process.argv.length != 3) {
      console.error("Missing or wrong test file path.")
      return
    }
    else
      await ingestDataBatch(process.argv[2]);

    process.exit()

  } catch (err) {
      console.log(err)
  }
}

run();