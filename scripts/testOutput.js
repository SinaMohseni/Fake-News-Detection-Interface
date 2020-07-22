process.env.NODE_ENV = 'dev'
const Topic = require('../models/Topic');
const mongoose = require('mongoose')
const config = require('config')
const fs = require('fs')
const { promisify } = require('util')

const readFile = promisify(fs.readFile);

const testOutputData = async(filename) => {

  console.log("Searhing for file: "+filename)

try {
  let data = await readFile(filename)

  data = JSON.parse(data)

  if(data.claim_id) {
      let topic = await Topic.findOne({claim_id : data.claim_id});
      if(topic) {
        console.log("Found matching Claim data")
        console.log("Verifying claim fields")
        let ok = true
        let claimFields = [
            "claim_attn",
            "confidence_model1",
            "confidence_model2",
            "confidence_model3",
            "confidence_model4",
            "confidence_overall",
            "prediction_overall",
            "articles"
          ];
        for(let field of claimFields) {
          if(data[field] == null) {
            console.log("Missing claim field: " + field);
            ok = false
          }
        }

        if(ok)
          console.log("Claim fields: OK")

        if(data.articles) {
          console.log("Verifying article fields")

          if(topic.articles.length == data.articles.length) {
            console.log("Number of articles matches the database")
          }
          else {
            console.log("Database shows that this claim should have: "+ topic.articles.length + " articles")
            console.log("Test outputs has: " + data.articles.length + " articles")
          }

          let articlesOk = true;

          for(let article of data.articles) {
            let articleFields = [
                "link",
                "top3_sent",
                "article_relevance",
                "text",
                "attn_article",
                "imp_article",
                "imp_article_source",
                "imp_claim",
                "imp_claim_source"
              ];

            for(let field of articleFields) {
              if(article[field] == null) {
                console.log("Missing article field: " + field);
                articlesOk = false
              }
            }
          }

          if(articlesOk)
            console.log("Article fields: OK")

          if(ok && articlesOk)
            console.log("Data format looks good!")
          else {
            console.log("Something is wrong with the format, please see previous errors")
          }
        }
      }
      else {
        console.log("Error: Couldn't find matching Claim data");
      }
    }
    else {
      console.log("Missing: claim_id");
    }

  } catch(err) {
    console.log(err)
    console.error("Couldn't find file or maybe a JSON parse error")
    return
  }
}

const run = async() => {
  try {
    await mongoose.connect(config.database.connectionString, { useNewUrlParser : true })
    if(process.argv.length != 3) {
      console.error("Missing or wrong test file path.")
      return
    }
    else
      await testOutputData(process.argv[2]);

    process.exit()
  } catch (err) {
      console.log(err)
  }
}

run();
