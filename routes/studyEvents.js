var Topic = {}; // require('../models/Topic_ood')
var Article = {};  //require('../models/Article_ood')

Topic = require('../models/Topic')
Article = require('../models/Article')

const TaskRun = require('../models/TaskRun')

const shortid = require('shortid')

const events = {}
const topicsPerCondition = 6;

function getQueryParams(qs) {
    qs = qs.split('+').join(' ');

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
}


events.studyEvent = async (req, res) => {
  // console.log("study event")
  const {action} = req.body
  console.log("----- action ----- ", action)
  // console.log(req.session.taskRun_id);
  if (req.session.taskRun_id != null){
    let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})

    if(action == "pre_study")              // pre-study is_done questionnaire
      taskRun.flags.pre_study = true;

    else if(action == "instructions")      // task done instructions
      taskRun.flags.instructions = true;   
    
    else if(action == "mid_survey_1_done")  
      taskRun.flags.mid_survey_1_done = true;

    else if(action == "mid_survey_2_done")  
      taskRun.flags.mid_survey_2_done = true;

    else if(action == "end_survey_1_done")  // end-study-1 done
      taskRun.flags.end_survey_1_done = true;

    else if(action == "end_survey_2_done")  // end-study-1 done
      taskRun.flags.end_survey_2_done = true;

    else if(action == "final_survey_done")      // post-study done questionnaire
      taskRun.flags.final_survey_done = true;

    await taskRun.save()
    res.send('event - thanks')
    //res.redirect("/study")
    return;
  }
  else {
    res.send("study event - no taskRun, whoops")
  }
}

events.nextTopicPlease = async (req, res) => {
  if (req.session.taskRun_id != null){
    let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})


    // Topic = require('../models/Topic')       // Topic_ood
    // Article = require('../models/Article')   // Article_ood

    if (taskRun.accuracy == 50){
        taskRun.current_topic++;

    } else if (taskRun.accuracy == 75){
        taskRun.current_topic++;

        let allTopics = await Topic.find({nicOK: true}).select('claim_id')
        let currentTopic = allTopics[taskRun.current_topic];
        this_condition = taskRun.condition_order[taskRun.current_condition]
        
        // console.log('----------this_condition :', this_condition)        
        let this_c = await Topic.findOne({claim_id: currentTopic.claim_id}).select('credibility')

        if (this_condition == "ai") {         
          this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_overall')
          this_p = (this_p.prediction_overall == 'True') ? 1 : 0;
          // Visuals.show('.lvl-one')
        }
        if (this_condition == "attention") {  
          this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_1_4')
          this_p = (this_p.prediction_1_4 == 'True') ? 1 : 0;
          // Visuals.show('.lvl-two')
        }
        if (this_condition == "attribute") {  
          this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_2_3')
          this_p = (this_p.prediction_2_3 == 'True') ? 1 : 0;
          // Visuals.show('.lvl-three')
        }
        if (this_condition == "expert") {     
          this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_overall')
          this_p = (this_p.prediction_overall == 'True') ? 1 : 0;
        }
        else{   // no-ai
         this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_overall')
         this_p = (this_p.prediction_overall == 'True') ? 1 : 0;
        }

        this_c = (this_c.credibility.includes('true')) ? 1 : 0;

        if (taskRun.last_skip == "false"){
          if (this_c == 0 && this_p == 1) {
            // console.log('cred: ', this_c, 'pred: ', this_p,taskRun.last_skip)
            taskRun.current_topic++;
            taskRun.last_skip = 'true';
          }
        }else{
          if (this_c == 1 && this_p == 0) {
            // console.log('cred: ', this_c, 'pred: ', this_p,taskRun.last_skip)
            taskRun.current_topic++;
            taskRun.last_skip = 'false';
          }
        }

    } else if (taskRun.accuracy == 100){
        taskRun.current_topic++;
        let allTopics = await Topic.find({nicOK: true}).select('claim_id')
        let currentTopic = allTopics[taskRun.current_topic];
        

        let this_p = await Topic.findOne({claim_id: currentTopic.claim_id}).select('prediction_overall')
        let this_c = await Topic.findOne({claim_id: currentTopic.claim_id}).select('credibility')

        this_p = (this_p.prediction_overall == 'True') ? 1 : 0;
        this_c = (this_c.credibility.includes('true')) ? 1 : 0;
              
        // console.log('cred: ', this_c, 'pred: ', this_p)
        if (this_c != this_p) taskRun.current_topic++;

    }

    // TODO: does not work if the user goes back to remove the selected articles. 
    if (req.params.choice == 'selected'){
      taskRun.current_selected_topic++;
      console.log("story selected: ", taskRun.current_selected_topic)
      // axios.post('/log/', {
      //     action: "storySelected",
      //     info: {
      //         topic: TOPICDATA.claim_id,
      //         article: event.target.dataset.article_id,
      //         timestamp: unix
      //     }
      //   }
      // );

    }else{
      console.log("story skipped", taskRun.current_topic - taskRun.current_selected_topic)
    }
    await taskRun.save()
    res.redirect("/study")
  }
  else {
    res.send("next topic please - no taskRun, whoops")
  }
}

events.studyStart = async (req, res) => {
  // console.log("Starting Study: ",req.params.studyType);
  let taskRun;
  
  // Topic = require('../models/Topic_ood')
  // Article = require('../models/Article_ood')

  // ------------ 2nd part of study --------
  if (req.session.taskRun_id != null && req.query.usr != 'god' && req.query.usr == 'mturk') {  // req.query.usr != 'god'
    console.log("I already know you: "+req.session.participant_id, " you are back! >>"+req.query.usr)
    taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})
  

    // end_survey_done is true when 2nd/4th survey is done.
    if(taskRun.flags.end_survey_1_done == false) {
      // page refershed or start over in -not-got-mode
      console.log('probably a lost connection or refershed page')
    
    }else{
      // ---  start 2nd condition --- 
      console.log("---- Starting the second condition! ")
          // create a new taskRun
      let newTaskRun = new TaskRun({
        participant_id : taskRun.participant_id,
        studyType : taskRun.studyType,
        condition_order : taskRun.condition_order,
        mturk_id : taskRun.mturk_id,
        accuracy : taskRun.accuracy,
        last_skip: taskRun.last_skip,
        current_condition: taskRun.current_condition + 1,
        totalStories: taskRun.totalStories,
        score: 0
      })

      if(taskRun.studyType == "trueNewsSelectionStudy" || taskRun.studyType == "fakeNewsSelectionStudy") {
        // console.log("starting a new task for the next condition")
        newTaskRun.current_topic = taskRun.current_topic;//  + 1;
        newTaskRun.current_selected_topic = taskRun.current_selected_topic; // + 1;
      }

      newTaskRun.flags.consented = true
      newTaskRun.flags.pre_study = true

      await newTaskRun.save()

      taskRun = newTaskRun;
      req.session.taskRun_id = taskRun._id
      req.session.participant_id = taskRun.participant_id
      // console.log('making new taskRun for the next condition')
    }
  
  // ------------ New user or god-mode --- 
  } else {
    console.log("--- NEW USER --- ")
    let type = req.params.studyType;
    if(type == "bestStudy"
      || type == "trueNewsSelectionStudy"
      || type == "fakeNewsSelectionStudy"
      || type == "editorStudy"
      || type == "game_trueOrFake"
      || type == "game_2Fakes1True") {

      

      
      last_skip = 'true'
      
      if (req.query.acc){ 
        model_accuracy = req.query.acc
      }else{
        // if undefined
        model_accuracy = 75;
      }

      if (req.query.usr == 'mturk') {
        this_usr_id = 'mturk'
        req.session.participant_id = null;
        req.session.taskRun_id = null;
        console.log("--- mturk mode: cleared the session --- ")
      }else{
        this_usr_id = 'god';
        req.session.participant_id = null;
        req.session.taskRun_id = null;
        console.log("--- god mode: cleared the session --- ")
      }
      
      let chosenConditionOrder = [];
      if (req.query.cond1){ 
        chosenConditionOrder.push(req.query.cond1); 
      }else{
        // if undefined
        chosenConditionOrder.push("expert");  
      }
      
      if (req.query.cond2){
        chosenConditionOrder.push(req.query.cond2);
      }else{ 
        // if undefined
        chosenConditionOrder.push("expert");
      }

      console.log("study condtions: ", chosenConditionOrder, ' - user id: ', this_usr_id, 'model acc: ', model_accuracy);

      // create a new taskRun
      taskRun = new TaskRun({
        participant_id : shortid.generate(),
        studyType : type,
        condition_order : chosenConditionOrder,
        mturk_id : this_usr_id,
        accuracy : model_accuracy,
        last_skip: last_skip, 
        current_condition: 0,
        current_topic: 0,
        current_selected_topic: 0,
        score: 0
      })
      await taskRun.save()
    } else {
      res.redirect('/whoops')
      return;
    }

    // console.log(taskRun._id);
    req.session.taskRun_id = taskRun._id
    req.session.participant_id = taskRun.participant_id
    // console.log(req.session);
    console.log('welcome to the study: '+req.session.participant_id)
  }

  events.renderNextStudyPage(taskRun, res)
}


// ------------- Demo -------------
events.renderNextStudyPage = async(taskRun, res) => {
  // figure out what step in the study task they should do
  this_usr_id = taskRun.mturk_id;
  res.redirect("/study")
}

// ------------- User Study -------------
// events.renderNextStudyPage = async(taskRun, res) => {
//   // figure out what step in the study task they should do
//   this_usr_id = taskRun.mturk_id;
//   if(taskRun.flags.consented == false) {
//     res.redirect("/study/infoSheet/"+this_usr_id)
//   } else if(taskRun.flags.pre_study == false) {
//     taskRun.totalStories = 12;
//     await taskRun.save();
//     res.redirect("/study/questions/pre")
//   } else if(taskRun.flags.instructions == false) {
//     res.redirect("/study/instructions")
//   } else if(taskRun.is_done == true) {
//     // study is done
//     //res.redirect("/study/instructions")
//   } else {
//     res.redirect("/study")
//   }
// }

events.renderInformationSheet = async(req, res) => {
  
  if(req.params.userType == 'god')
    res.render('study/informationSheet_no_id')
  else
    res.render('study/informationSheet')
  
}

// const renderInformationSheet = (req, res) => res.render('study/informationSheet', {
//   // req.params.userType
//   user: req.user,
//   title: "X-Fake Information Sheet"
// })

events.consentToStudy = async(req, res) => {
    if (req.session.taskRun_id != null) {
      let taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})

    if(taskRun.flags.consented) {
      console.log("already consented but trying to consent again?", "Old mTurk ID: ", taskRun.mturk_id)
    }
    
    // Log the m_turk id here 
    if (taskRun.mturk_id != 'god'){
      taskRun.mturk_id = req.params.mturk_id;  
    }

    taskRun.flags.consented = true;

    await taskRun.save()

    events.renderNextStudyPage(taskRun, res)
  } else {
    console.error("trying to consent but no TaskRun found")
    res.redirect("/")
  }

}

events.renderComplete = async(req, res) => {
  console.log("Completing the study");

  if (req.session.participant_id != null) {
    taskRun = await TaskRun.findOne({_id: req.session.taskRun_id})
    res.render('study/complete', {taskRun: taskRun })
  }
  else {
    console.log("big error, you cant complete before you start")
    res.redirect('/')
  }
}

events.renderVerify = async(req, res) => {
  res.render('study/verify.pug', {})
}

events.verify = async(req, res) => {
  let {participant_id} = req.body

  let taskRuns = await TaskRun.find({participant_id: participant_id}).lean()

  let allConditionsComplete = true;
  let atLeastOnePostStudy = false;

  for(let sess of taskRuns) {
    if(sess.flags.end_survey_2_done == false)
      allConditionsComplete = false
    if(sess.flags.final_survey_done == true)
      atLeastOnePostStudy = true
  }

  res.send({
    complete: allConditionsComplete && atLeastOnePostStudy,
    taskRuns: taskRuns
  })
}

events.clearStudySession = async(req, res) => {

  req.session.participant_id = null;
  req.session.taskRun_id = null;
  res.redirect('/')
}

module.exports = events;
