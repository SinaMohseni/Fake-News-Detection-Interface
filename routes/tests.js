const axios = require('axios')
const extractor = require('unfluff')
const Topic = require('../models/Topic')

const tests = {}

tests.topicList = async (req, res) => {
  // read topics from files for now i guess
  let topics = await Topic.find({}).select('claim_id claim')
  res.render('topicList', { topics : topics, user: req.user, title: "Topic List" })
}

tests.renderRandom = async (req, res) => {
  let allTopics = await Topic.find({nicOK: true}).select('claim_id')

  // choose a random topic
  let randomTopic = allTopics[Math.floor(Math.random()*allTopics.length)];
  res.redirect('/topic/'+randomTopic.claim_id);
}

tests.renderTopic = async (req, res) => {
  let topicData = await Topic.findOne({claim_id: req.params.claim_id})
  res.render('topic', { topic : topicData, user: req.user, title: "Topic: "+topicData.claim_id })
}


tests.unfluff = async (req, res) => {
  //console.log(req);

  let url = req.query.url
  console.log(url);
  try {
    const response = await axios.get(url);

    const siteData = extractor(response.data);

    console.log("title: ", siteData.title);
    console.log("date: ", siteData.date);
    console.log("author: ", siteData.author);
    console.log("publisher: ", siteData.publisher);
    console.log("image: ", siteData.image);
    console.log("text: ", siteData.text);

  } catch (error) {
    console.error(error);
  }

  res.send("unfluffing");
}

tests.stats = async (req, res) => {
  let topics = await Topic.find({}).select('claim_id')
  let justNic = req.query.justNicOK ? true : false;

  console.log("computing stats");
  console.log(req.query);

  let stats = {
    total: 0,
    true: 0,
    mostlyTrue: 0,
    mostlyFalse: 0,
    false: 0,
    tags: {},
    articles: {},
    links: {},
    hasDescription: 0,
    hasExample: 0,
    hasFactCheck: 0,
    hasLastUpdate: 0,
    hasOriginallyPublished: 0,
    hasOrigins: 0,
  }

  for(let t of topics) {
    let topicData = await Topic.findOne({claim_id: t.claim_id})

    if(justNic && topicData.nicOK == false) continue;

    stats.total++;

    if(topicData.credibility == "true") stats.true++;
    if(topicData.credibility == "mostly true") stats.mostlyTrue++;
    if(topicData.credibility == "mostly false") stats.mostlyFalse++;
    if(topicData.credibility == "false") stats.false++;

    if(stats.tags[topicData.tags.length]) {
      stats.tags[topicData.tags.length]++;
    } else {
      stats.tags[topicData.tags.length] = 1;
    }

    if(stats.articles[topicData.articles.length]) {
      stats.articles[topicData.articles.length]++;
    } else {
      stats.articles[topicData.articles.length] = 1;
    }

    if(stats.links[topicData.referred_links.length]) {
      stats.links[topicData.referred_links.length]++;
    } else {
      stats.links[topicData.referred_links.length] = 1;
    }

    if(topicData.description.length > 0) stats.hasDescription++;
    if(topicData.example.length > 0) stats.hasExample++;
    if(topicData.fact_check.length > 0) stats.hasFactCheck++;
    if(topicData.last_updated.length > 0) stats.hasLastUpdate++;
    if(topicData.originally_published.length > 0) stats.hasOriginallyPublished++;
    if(topicData.origins.length > 0) stats.hasOrigins++;
  }
  res.send(stats);
  //res.render('stats', { stats : JSON.parse(stats), user: req.user })
}

tests.csv = async (req, res) => {
  let topics = await Topic.find({}).select('claim_id')

  let csv = "claim_id, credibility, claim length, description length, example length, fact_check length, last_updated, originally_published, origins length, link count, tag count, url, article counts<br/>"

  let count = 0;
  for(let t of topics) {
    let topicData = await Topic.findOne({claim_id: t.claim_id})

    csv += topicData.claim_id + ","
      + topicData.credibility + ","
      + topicData.claim.length + ","
      + topicData.description.length + ","
      + topicData.example.length + ","
      + topicData.fact_check.length + ","
      + topicData.last_updated + ","
      + topicData.originally_published + ","
      + topicData.origins.length + ","
      + topicData.referred_links.length + ","
      + topicData.tags.length + ","
      + topicData.url + ","
      + topicData.articles.length + ","
      + topicData.nicOK + "<br/>"

    count++
    //if (count > 10) break;
  }
  res.send(csv);
}

module.exports = tests
