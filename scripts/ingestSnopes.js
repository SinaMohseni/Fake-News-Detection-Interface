process.env.NODE_ENV = 'dev'
const Topic = require('../models/Topic');
const Article = require('../models/Article');
const mongoose = require('mongoose')
const config = require('config')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

// const snopesFolder = './xai_snopes_v1.0/xai_snopes'
const snopesFolder = './xai_snopes/xai_snopes_v2.0/'

const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);


const dropIndexes = (Model) => {
  return new Promise( (resolve, reject) => {
    Model.collection.dropIndexes(err => {
      if ( err ) { console.error(err); }
      else { console.log(Model.modelName, "Dropped indexes!"); resolve(true); }
    })
  })
}

const addTopics = async() => {
  //await dropIndexes(Topic)
  await Topic.deleteMany({}, (err) => {
    if (err) { console.error(err);}
    else {
      console.log("topics cleared")
    }
  })


  let topicList = await readDir(snopesFolder)


  console.log("adding topics: "+topicList.length);

  let count = 0;
  for(let topicFile of topicList) {
    let topicData = await readFile(snopesFolder + '/' + topicFile)
    topicData = JSON.parse(topicData)
    let tags = topicData["Tags"].split(';');
    tags = tags.splice(0, tags.length - 1);

    let links = topicData["Referred Links"].split(';');
    links = links.splice(0, links.length - 1);



    let isItGood = false;

    if(topicData["Description"].length > 10
    && topicData["Last Updated"].length > 5
    && topicData["Articles_crawled"].length > 7)
      isItGood = true;

    const t = new Topic({
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

    // create articles
    let articles = [];
    for(let a of topicData["Articles_crawled"]) {
      let article = new Article({
        domain : a.domain,
        link : a.link,
        link_type : a.link_type,
        text : a.text,
        title : a.title,
        topic : t._id
      });
      await article.save()
      articles.push(article._id);
    }

    t.articles = articles;

    //console.log(isItGood +" | "+t.nicOK);
    t.save().then( () => {
      count++
      if(count % 400 == 0) console.log("Completed: "+count)

      if(count == topicList.length) console.log("All Doneskis: "+count)
    })
  }
  console.log("Completed: "+count)
  return;
}


const run = async() => {
  try {
    await mongoose.connect(config.database.connectionString, { useNewUrlParser : true })
    await addTopics();
    return;
  } catch (err) {
      console.log(err)
  }

}

run();
