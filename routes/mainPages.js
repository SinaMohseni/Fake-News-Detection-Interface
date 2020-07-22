var Topic = {}; 
var Article = {};

Topic = require('../models/Topic')  // Topic_ood
Article = require('../models/Article') // Article_ood


const TaskRun = require('../models/TaskRun')
const axios = require('axios')
const extractor = require('unfluff')

const main = {}

main.renderQuestions = async (req, res) => {

  if (req.session.taskRun_id != null) {
    let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})

    res.render('study/questions', {taskRun: taskRun, questionSet: req.params.questionSet})
  } else {
    console.error("trying to go to questions but no TaskRun found")
    res.redirect("/")
  }
}

main.renderStudyInstructions = async(req, res) => {
  console.log("showing study instructions");
  if (req.session.taskRun_id != null) {
    let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})

    res.render('study/begin', {taskRun: taskRun, studyType: taskRun.studyType })

  } else {
    console.error("trying to show instructions but no TaskRun found")
    res.redirect("/")
  }
}



// --------------- Demo (only news review) ----------------
main.renderStudyHome = async (req, res) => {


  if (req.session.taskRun_id != null) {
    let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id}).populate('presented_topics chosen_articles')
    let topics = [];
    
    //  ------------- Study Procedure Management --------------
    // ----- Use a negative number to jump a study section -----
    first_sec = -1;     // 1st part   
    second_sec = 400;     // 2nd part 
    third_sec = 800;      // 3rd part
    fourth_sec = 1200;     // 4th part


    // skipping the removed survey(s) 
    if (first_sec < 0  && taskRun.flags.mid_survey_1_done == false) {
      taskRun.flags.mid_survey_1_done = true;
      await taskRun.save();
    }
    if (second_sec < 0  && taskRun.flags.end_survey_1_done == false) {
      taskRun.flags.end_survey_1_done = true;
      await taskRun.save();
    }
    if (third_sec < 0  && taskRun.flags.mid_survey_2_done == false) {
      taskRun.flags.mid_survey_2_done = true;
      await taskRun.save();
    }
    if (fourth_sec < 0  && taskRun.flags.end_survey_2_done == false) {
      taskRun.flags.end_survey_2_done = true;
      await taskRun.save();
    }


    if(taskRun.studyType == "trueNewsSelectionStudy" || taskRun.studyType == "fakeNewsSelectionStudy" ) {  //curatorStudy
      
      // ----- First Questionnaire
      if (taskRun.current_selected_topic > first_sec && taskRun.flags.mid_survey_1_done == false  && taskRun.current_condition == 0) {

            console.log("-- Show 1st survey")
            // res.redirect("/study/questions/mid_cond_1")   // midAI


      // ----- Second Questionnaire -----
      } else if(taskRun.current_selected_topic > second_sec  && taskRun.flags.mid_survey_1_done == true && taskRun.current_condition == 0) {
          
          if (taskRun.flags.end_survey_1_done == false) {
            //  ----- Start 2nd survey -----
            console.log("-- Show 2nd survey")
            // res.redirect("/study/questions/end_cond_1")  // 2   taskEndNone
          }else{
            //  ----- 2nd survey done -----
            // ----- Starting 2nds condition ------      
            console.log("-- 2nd survey Done: continue to the second part of study")
            // res.redirect("/begin/"+taskRun.studyType)

          }
      // the mid_survey_done will be reset to flase at the beginning of 2nd part.
      // ----- 3rd questionnairs -----
      } else if( taskRun.current_selected_topic > third_sec && taskRun.flags.mid_survey_2_done == false && taskRun.current_condition == 1) {
          console.log("-- Show 3rd survey")
          // res.redirect("/study/questions/mid_cond_2") // midNone

      // ----- 4th survey and post questionnairs ----- 
      } else if(taskRun.current_selected_topic > fourth_sec && taskRun.flags.mid_survey_2_done == true && taskRun.current_condition == 1) {

        if(taskRun.flags.end_survey_2_done == false) {
          // ----- start the 4th survey ----
            // res.redirect("/study/questions/end_cond_2")  // taskEndNone
        } else if(taskRun.flags.final_survey_done == false) {
            // ----- start the final study survey -----
            // res.redirect("/study/questions/complete")
        } else {
            // ----- study is over -----
          // res.redirect("/study/completed")
        }
       
      // ---- Basic news story pages ----
      } else {
        // Topic = require('../models/Topic')  // Topic_ood
        // Article = require('../models/Article') // Article_ood
        let allTopics = await Topic.find({nicOK: true}).select('claim_id')
        
        // console.log('allTopics', allTopics)
        // --- choose next topic based on taskRun.current_topic
        // -- balance TP and FP rates
        let currentTopic = allTopics[taskRun.current_topic];
        
        // taskRun.condition_order[taskRun.current_condition]
        // let this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_overall');
        // let this_c = await Topic.findOne({claim_id: currentTopic.claim_id}).select('credibility');
        // console.log(this_c.credibility, this_p.prediction_overall)  //, t1

        res.redirect('/study/topic/' + currentTopic.claim_id);
        if (allTopics.length <= taskRun.current_topic){
          taskRun.current_topic = 0;
          await taskRun.save();
        }
      }
    }
  }
  else {
      console.log("Can't find this study studyType")
      res.redirect('/');
  }
}


// --------------- User Study ----------------
// main.renderStudyHome = async (req, res) => {


//   if (req.session.taskRun_id != null) {
//     let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id}).populate('presented_topics chosen_articles')
//     let topics = [];
    
//     //  ------------- Study Procedure Management --------------
//     // ----- Use a negative number to jump a study section -----
//     first_sec = -1;     // 1st part   
//     second_sec = 4;     // 2nd part 
//     third_sec = 8;      // 3rd part
//     fourth_sec = 12;     // 4th part


//     // skipping the removed survey(s) 
//     if (first_sec < 0  && taskRun.flags.mid_survey_1_done == false) {
//       taskRun.flags.mid_survey_1_done = true;
//       await taskRun.save();
//     }
//     if (second_sec < 0  && taskRun.flags.end_survey_1_done == false) {
//       taskRun.flags.end_survey_1_done = true;
//       await taskRun.save();
//     }
//     if (third_sec < 0  && taskRun.flags.mid_survey_2_done == false) {
//       taskRun.flags.mid_survey_2_done = true;
//       await taskRun.save();
//     }
//     if (fourth_sec < 0  && taskRun.flags.end_survey_2_done == false) {
//       taskRun.flags.end_survey_2_done = true;
//       await taskRun.save();
//     }


//     if(taskRun.studyType == "trueNewsSelectionStudy" || taskRun.studyType == "fakeNewsSelectionStudy" ) {  //curatorStudy
      
//       // ----- First Questionnaire
//       if (taskRun.current_selected_topic > first_sec && taskRun.flags.mid_survey_1_done == false  && taskRun.current_condition == 0) {

//             console.log("-- Show 1st survey")
//             res.redirect("/study/questions/mid_cond_1")   // midAI


//       // ----- Second Questionnaire -----
//       } else if(taskRun.current_selected_topic > second_sec  && taskRun.flags.mid_survey_1_done == true && taskRun.current_condition == 0) {
          
//           if (taskRun.flags.end_survey_1_done == false) {
//             //  ----- Start 2nd survey -----
//             console.log("-- Show 2nd survey")
//             res.redirect("/study/questions/end_cond_1")  // 2   taskEndNone
//           }else{
//             //  ----- 2nd survey done -----
//             // ----- Starting 2nds condition ------      
//             console.log("-- 2nd survey Done: continue to the second part of study")
//             res.redirect("/begin/"+taskRun.studyType)

//           }
//       // the mid_survey_done will be reset to flase at the beginning of 2nd part.
//       // ----- 3rd questionnairs -----
//       } else if( taskRun.current_selected_topic > third_sec && taskRun.flags.mid_survey_2_done == false && taskRun.current_condition == 1) {
//           console.log("-- Show 3rd survey")
//           res.redirect("/study/questions/mid_cond_2") // midNone

//       // ----- 4th survey and post questionnairs ----- 
//       } else if(taskRun.current_selected_topic > fourth_sec && taskRun.flags.mid_survey_2_done == true && taskRun.current_condition == 1) {

//         if(taskRun.flags.end_survey_2_done == false) {
//           // ----- start the 4th survey ----
//             res.redirect("/study/questions/end_cond_2")  // taskEndNone
//         } else if(taskRun.flags.final_survey_done == false) {
//             // ----- start the final study survey -----
//             res.redirect("/study/questions/complete")
//         } else {
//             // ----- study is over -----
//           res.redirect("/study/completed")
//         }
       
//       // ---- Basic news story pages ----
//       } else {
//         // Topic = require('../models/Topic')  // Topic_ood
//         // Article = require('../models/Article') // Article_ood
//         let allTopics = await Topic.find({nicOK: true}).select('claim_id')
        
//         // console.log('allTopics', allTopics)
//         // --- choose next topic based on taskRun.current_topic
//         // -- balance TP and FP rates
//         let currentTopic = allTopics[taskRun.current_topic];
        
//         // taskRun.condition_order[taskRun.current_condition]
//         // let this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_overall');
//         // let this_c = await Topic.findOne({claim_id: currentTopic.claim_id}).select('credibility');
//         // console.log(this_c.credibility, this_p.prediction_overall)  //, t1

//         res.redirect('/study/topic/' + currentTopic.claim_id);
//         if (allTopics.length <= taskRun.current_topic){
//           taskRun.current_topic = 0;
//           await taskRun.save();
//         }
//       }
//     }
//   }
//   else {
//       console.log("Can't find this study studyType")
//       res.redirect('/');
//   }
// }

main.renderTopicExplorer = async (req, res) => {

  let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})
  
  // Topic = require('../models/Topic')   // Topic_ood
  // Article = require('../models/Article')   // Article_ood

  let topicData = await Topic.findOne({claim_id: req.params.claim_id}).populate('articles')

  taskRun.completionText = "Unknown";
  if(taskRun.studyType == "bestStudy") {
    taskRun.completionText = taskRun.chosen_articles.length + " of 6 articles selected"

    res.render('study/topicExplore', { user: req.user,
      taskRun: taskRun,
      title: "Explore: "+topicData.claim_id,
      topic : topicData
    })
  } else if (taskRun.studyType == "trueNewsSelectionStudy") {
    res.render('study/trueNewsSelectionStudy/topicExplore', { user: req.user,
      taskRun: taskRun,
      title: "Explore: "+topicData.claim_id,
      topic : topicData
    })
  }

}

main.renderArticle = async (req, res) => {
  let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})

  // Topic = require('../models/Topic')   // Article_ood
  // Article = require('../models/Article')   // Article_ood

  let topicData = await Topic.findOne({claim_id: req.params.claim_id})
  let articleData = await Article.findOne({_id: req.params.article_id})

  if(taskRun.studyType == "bestStudy") {
    res.render('study/article', { user: req.user,  taskRun: taskRun, title: "Article", topic : topicData, article: articleData})
  } else if (taskRun.studyType == "trueNewsSelectionStudy") {
      res.render('study/trueNewsSelectionStudy/article', { user: req.user,  taskRun: taskRun, title: "Article", topic : topicData, article: articleData})
  }
}

module.exports = main