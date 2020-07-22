const TaskRun = require('../models/TaskRun')
const Interaction = require('../models/Interaction')
const mongoose = require('mongoose')

const logging = {}

logging.logInteraction = async (req, res) => {
  const {action, info} = req.body


  // if (req.session.taskRun_id != null){
  //   let loggedAct = new Interaction({
  //     taskRun : mongoose.Types.ObjectId(req.session.taskRun_id),
  //     action: action,
  //     details: info
  //   })
  //   await loggedAct.save()
  //   res.send("log - thanks")
  // }
  // else {
  //   console.error("got a log interaction, but no taskRun found")
  //   res.send("log - no taskRun, whoops")
  // }
  
}

logging.allParticipants = async (req, res) => {

  let allTaskRuns = await TaskRun.find({}).lean().exec()
  let participants = []
  let participantObjs = []
  for(let taskRun of allTaskRuns) {
      if(participants.indexOf(taskRun.participant_id) == -1) {
        let participantObj = {
          id: taskRun.participant_id,
          mTurk: taskRun.mturk_id,
          date: taskRun.createdAt,
          taskRuns: []
        }
        participantObj.taskRuns.push(taskRun._id)
        participantObjs.push(participantObj)
        participants.push(taskRun.participant_id)

      }else {
        participantObjs[participants.indexOf(taskRun.participant_id)].taskRuns.push(taskRun._id)
      }
  }


  let csvString = "Date, ID, mTurk , Condition, Progress<br/>";

  for(let participant of participantObjs) {
    
    let participantTaskRuns = await TaskRun.find({participant_id: participant.id}).select('_id').lean().exec()
    let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()

    // console.log(participantTaskRuns.condition_order[participantTaskRuns.current_condition])

    // let taskRun
    let study_status = "left the study"
    for(let interaction of interactionsForParticipant) {
      var taskRun = interaction.taskRun
      var this_condition = taskRun.condition_order[taskRun.current_condition]
      if (interaction.action == 'mid_survey_1') study_status = '1/4 done'
      if (interaction.action == 'mid_survey_2') study_status = 'half done'
      if (interaction.action == 'end_survey_1') study_status = '3/4 done'
      if (interaction.action == 'post_study_survey' || interaction.action == 'end_survey_2') study_status = 'almost done'
      if (interaction.action == 'post_study_survey' || interaction.action == 'end_survey_2') study_status = 'complete'
    }
    // let study_status = (participant.taskRuns.length == 2) ? "complete":"half"
    csvString += (participant.date).toString().slice(3,15) + "," + participant.id + "," + participant.mTurk + ","  +  this_condition + "," + study_status + "<br/>"
  }

  res.send(csvString)
}

logging.allTaskRuns = async (req, res) => {

  let allTaskRuns = await TaskRun.find({}).lean().exec()
  let csvString = "participant id, task run id, study type, condition, start time, last updated time, chosen articles count,"
    + "consented, mturk_id, pre questions, instructions, mid questions, post-condition questions, post-study questions <br/>"

  for(let taskRun of allTaskRuns) {
    csvString += taskRun.participant_id + ","
        + taskRun._id + ","
        + taskRun.studyType + ","
        + taskRun.condition_order[taskRun.current_condition] + ","
        + taskRun.createdAt + ","
        + taskRun.updatedAt + ","
        + taskRun.chosen_articles.length + ","
        + taskRun.flags.consented + ","
        + taskRun.mturk_id + ","
        + taskRun.flags.pre_study + ","
        + taskRun.flags.instructions + ","
        + taskRun.flags.mid_study_one + ","
        + taskRun.flags.post_condition + ","
        + taskRun.flags.post_study
        + "<br/>"
  } 
  res.send(csvString)
}

logging.allEvents = async (req, res) => {

  let allInteractions = await Interaction.find({}).populate('taskRun').lean().exec()
  let csvString = "participant id, task run id, study type, condition, time, action, details<br/>"

  for(let interaction of allInteractions) {

    let detailsCSV = ""
    for(let detailName in interaction.details) {
      detailsCSV += detailName + "," + interaction.details[detailName] + ","
    }
      detailsCSV = detailsCSV.slice(0,-1);

    let taskRun = interaction.taskRun

    csvString += taskRun.participant_id + ","
        + taskRun._id + ","
        + taskRun.studyType + ","
        + taskRun.condition_order[taskRun.current_condition] + ","
        + interaction.createdAt + ","
        + interaction.action + ","
        + detailsCSV
        + "<br/>"
  } 
  res.send(csvString)
}

logging.eventsForParticipant = async (req, res) => {


  const participantId = req.params.participantId
  let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
  // console.log("found task runs: "+participantTaskRuns.length);
  let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()
  // console.log("found interactions: "+interactionsForParticipant.length);

  let csvString = "ID, mTurk, condition, action, details<br/>"

  for(let interaction of interactionsForParticipant) {

    let detailsCSV = ""
    for(let detailName in interaction.details) {
      detailsCSV += detailName + "," + interaction.details[detailName] + ","
    }

    detailsCSV = detailsCSV.slice(0,-1);

    let taskRun = interaction.taskRun

    csvString += taskRun.participant_id + ","
        // + taskRun._id + ","
        + taskRun.mturk_id + ","
        // + taskRun.studyType + ","
        + taskRun.condition_order[taskRun.current_condition] + ","
        // + interaction.createdAt + ","
        + interaction.action + ","
        + detailsCSV
        + "<br/>"
  } 
  res.send(csvString)
}

logging.interactionforParticipant = async (req, res) => {
  const participantId = req.params.participantId
  let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
  // console.log("found task runs: "+participantTaskRuns.length);
  let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()
  // console.log("found interactions: "+interactionsForParticipant.length);

  let csvString = "ID, mTurk, condition, action, details<br/>"
  let all_surveys = ['mid_survey_1', 'mid_survey_2', 'end_survey_1', 'end_survey_2', 'survey_preStudy', 'post_study_survey']

  for(let interaction of interactionsForParticipant) {
    
      if (all_surveys.includes(interaction.action) == false){
        let detailsCSV = ""
        for(let detailName in interaction.details) {
          detailsCSV += detailName + "," + interaction.details[detailName] + ","
        }

        detailsCSV = detailsCSV.slice(0,-1);

        let taskRun = interaction.taskRun

        csvString += taskRun.participant_id + ","
            // + taskRun._id + ","
            + taskRun.mturk_id + ","
            // + taskRun.studyType + ","
            + taskRun.condition_order[taskRun.current_condition] + ","
            // + interaction.createdAt + ","
            + interaction.action + ","
            + detailsCSV
            + "<br/>"
      }
  } 
  res.send(csvString)
}

logging.allSurveys = async (req, res) => {

  let allInteractions = await Interaction.find({}).populate('taskRun').lean().exec()
  
  let csvString = "ID, mTurk, Condition, Survey, enough_information, helpful_interface, helpful_ai," +
                  "exp_useful_understanding, true_selection, confident_selection, ai_accuracy," +  
                  "ai_understanding,ai_weaknesses,ai_reliance,ai_trust, trust_when, strategy, reasoning, limitation, additional, timestamp <br/>"

  for(let interaction of allInteractions) {

    all_surveys = ['survey_preStudy','mid_survey_1', 'mid_survey_2', 'end_survey_1', 'end_survey_2', 'post_study_survey']   // survey_preStudy 
    if (all_surveys.includes(interaction.action)){
          let detailsCSV = ""
          for(let detailName in interaction.details) {
            txt = interaction.details[detailName]
            detailsCSV += interaction.details[detailName].toString().replace(',', ' ') + ","
            // detailsCSV += detailName + "," + interaction.details[detailName] + ","
          }
          detailsCSV = detailsCSV.slice(0,-1);
    
          let taskRun = interaction.taskRun
    
          csvString += taskRun.participant_id + ","
              + taskRun.mturk_id + ","
              + taskRun.condition_order[taskRun.current_condition] + ","
              + interaction.action + ","
              + detailsCSV
              + "<br/>"
    }
  } 
  res.send(csvString)
}


logging.surveyforParticipant = async (req, res) => {

  const participantId = req.params.participantId
  
  let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
  let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()

    let csvString = "ID, mTurk, Condition, Survey, enough_information, helpful_interface, helpful_ai," +
                  "exp_useful_understanding, true_selection, confident_selection, ai_accuracy," +  
                  "ai_understanding,ai_weaknesses,ai_reliance,ai_trust, trust_when, strategy, reasoning, limitation, additional, timestamp <br/>"

  for(let interaction of interactionsForParticipant) {
    // --- all surveys --- 
    all_surveys = ['mid_survey_1', 'mid_survey_2', 'end_survey_1', 'end_survey_2', 'post_study_survey']   // survey_preStudy  'post_study_survey'
    if (all_surveys.includes(interaction.action)){
      let detailsCSV = ""
          
          for(let detailName in interaction.details) {
            detailsCSV += interaction.details[detailName].toString().replace(',', ' ') + ","
            // detailsCSV += interaction.details[detailName].replace(',', ' ') + ","
            // detailsCSV += detailName + "," + interaction.details[detailName] + ","
          }
          
          detailsCSV = detailsCSV.slice(0,-1);

          let taskRun = interaction.taskRun

          csvString += taskRun.participant_id + ","
              + taskRun.mturk_id + ","
              + taskRun.condition_order[taskRun.current_condition] + ","
              + interaction.action + ","
              + detailsCSV
              + "<br/>"
    }
  }
  res.send(csvString)
}


//---  log for end survey: end_survey_2
logging.endsurveyforParticipant = async (req, res) => {

  // const participantId = req.params.participantId
  var participantId = req.params.participantId
  var participantObjs = participantId.split(',');
  // participantObjs = participantObjs_xai_all // participantObjs_noai  + participantObjs_ai + participantObjs_xai_attn + participantObjs_xai_attr + participantObjs_xai_all;

  let csvString = "ID, mTurk, Condition, Survey, enough_information, helpful_interface, helpful_ai," +
                  "exp_useful_understanding, true_selection, confident_selection, ai_accuracy," +  
                  "ai_understanding,ai_weaknesses,ai_reliance,ai_trust, trust_when, strategy, reasoning, limitation, additional, timestamp <br/>"

  for(let participant of participantObjs) {

    participantId = participant;// .id;
    let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
    let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()
    
    for(let interaction of interactionsForParticipant) {
    // --- all surveys --- 
    all_surveys = ['end_survey_2']   // survey_preStudy  'post_study_survey'
    if (all_surveys.includes(interaction.action)){
      let detailsCSV = ""
          
          for(let detailName in interaction.details) {
            detailsCSV += interaction.details[detailName].toString().replace(',', ' ') + ","
          }
          
          detailsCSV = detailsCSV.slice(0,-1);

          let taskRun = interaction.taskRun
    
          csvString += taskRun.participant_id + ","
              + taskRun.mturk_id + ","
              + taskRun.condition_order[taskRun.current_condition] + ","
              + interaction.action + ","
              + detailsCSV
              + "<br/>"
    }
  }

  }
  
  res.send(csvString)
}


// --- all qualitative surveys : post_study_survey
logging.qualsurveyforParticipant = async (req, res) => {

  // const participantId = req.params.participantId

  var participantId = req.params.participantId
  var participantObjs = participantId.split(',');
  // participantObjs = participantObjs_xai_all // participantObjs_noai; + participantObjs_ai + participantObjs_xai_attn + participantObjs_xai_attr + participantObjs_xai_all;

    let csvString = "ID, mTurk, Condition, Survey, enough_information, helpful_interface, helpful_ai," +
                  "exp_useful_understanding, true_selection, confident_selection, ai_accuracy," +  
                  "ai_understanding,ai_weaknesses,ai_reliance,ai_trust, trust_when, strategy, reasoning, limitation, additional, timestamp <br/>"

  for(let participant of participantObjs) {
      participantId =  participant;
      let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
      let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()

      for(let interaction of interactionsForParticipant) {
        // --- all surveys --- 
        all_surveys = ['post_study_survey']   // survey_preStudy  'post_study_survey'
        if (all_surveys.includes(interaction.action)){
          let detailsCSV = ""
              
              for(let detailName in interaction.details) {
                detailsCSV += interaction.details[detailName].toString().replace(/,/g, ' ') + ","
                // detailsCSV += interaction.details[detailName].replace(',', ' ') + ","
                // detailsCSV += detailName + "," + interaction.details[detailName] + ","
              }
              
              detailsCSV = detailsCSV.slice(0,-1);

              let taskRun = interaction.taskRun
        
              csvString += taskRun.participant_id + ","
                  + taskRun.mturk_id + ","
                  + taskRun.condition_order[taskRun.current_condition] + ","
                  + interaction.action + ","
                  + detailsCSV
                  + "<br/>"
        }
      }
  }
  res.send(csvString)
}



logging.timesurveyforParticipant = async (req, res) => {


  // const participantId = req.params.participantId
  var participantId = req.params.participantId
  var participantObjs = participantId.split(',');
  participantObjs = participantObjs_xai_all // praticipantObjs_noai; + participantObjs_ai + participantObjs_xai_attn + participantObjs_xai_attr + participantObjs_xai_all;

    let csvString = "ID, mTurk, Condition, Survey, enough_information, helpful_interface, helpful_ai," +
                  "exp_useful_understanding, true_selection, confident_selection, ai_accuracy," +  
                  "ai_understanding,ai_weaknesses,ai_reliance,ai_trust, trust_when, strategy, reasoning, limitation, additional, timestamp <br/>"

  for(let participant of participantObjs) {
  
        participantId =  participant;

        let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
        let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()

        for(let interaction of interactionsForParticipant) {
          // --- all surveys --- 
          all_surveys = ['mid_survey_1', 'mid_survey_2', 'end_survey_1', 'end_survey_2']   // survey_preStudy  'post_study_survey'
          if (all_surveys.includes(interaction.action)){
            let detailsCSV = ""
                
                for(let detailName in interaction.details) {
                  detailsCSV += interaction.details[detailName].toString().replace(',', ' ') + ","
                  // detailsCSV += interaction.details[detailName].replace(',', ' ') + ","
                  // detailsCSV += detailName + "," + interaction.details[detailName] + ","
                }
                
                detailsCSV = detailsCSV.slice(0,-1);

                let taskRun = interaction.taskRun
          
                csvString += taskRun.participant_id + ","
                    + taskRun.mturk_id + ","
                    + taskRun.condition_order[taskRun.current_condition] + ","
                    + interaction.action + ","
                    + detailsCSV
                    + "<br/>"
          }
        }
  }
  res.send(csvString)
}



logging.presurveyforParticipant = async (req, res) => {

  // const participantId = req.params.participantId
  var participantId = req.params.participantId
  var participantObjs = participantId.split(',');
  // participantObjs = participantObjs_xai_all // participantObjs_noai  + participantObjs_ai + participantObjs_xai_attn + participantObjs_xai_attr + participantObjs_xai_all;

  let csvString = "ID, mTurk, Condition, Survey, gender, education, age," +
                  "howOften, newsJob, newsType_str, newsSource_str," +  
                  "fake news ratio, AI accuracy <br/>"

  for(let participant of participantObjs) {

    participantId = participant;
    let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
    let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()
    
    for(let interaction of interactionsForParticipant) {
    // --- all surveys --- 
    all_surveys = ['survey_preStudy'] 
    if (all_surveys.includes(interaction.action)){
      let detailsCSV = ""
          
          for(let detailName in interaction.details) {
            detailsCSV += interaction.details[detailName].toString().replace(',', ' ') + ","
          }
          
          detailsCSV = detailsCSV.slice(0,-1);

          let taskRun = interaction.taskRun
    
          csvString += taskRun.participant_id + ","
              + taskRun.mturk_id + ","
              + taskRun.condition_order[taskRun.current_condition] + ","
              + interaction.action + ","
              + detailsCSV
              + "<br/>"
    }
  }

  }
  
  res.send(csvString)
}


logging.interactionAnalysis = async (req, res) => {

  // const participantId = req.params.participantId

  var participantId = req.params.participantId
  var participantObjs = participantId.split(',');

  let csvString = "ID, condition, " + 
                  "HIT duration,task duration,survey duration, user click , character count, " +   // engagement
                  "news veracity, model accuracy," +                                               // model and news
                  "user shared news, user reported news, claim checked, article checked, " +      // performance
                  "model prediction checked,claim exp checked,artilce exp checked, " +             // usefulness
                  "user prediction task (model), " +                                                // mental model
                  "user agreement (model), user agreement (exp), perceived accuracy (last), " +     // trust
                  " <br/>"

  for(let participant of participantObjs) {

      participantId = participant; 
      
      console.log('analysis for: ', participantId)


      let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
      let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()
      let taskRun;

      let all_surveys = ['mid_survey_1', 'mid_survey_2', 'end_survey_1', 'end_survey_2', 'survey_preStudy', 'post_study_survey']
      let response_forms = ['strategy', 'reasoning',  'limitation', 'additional']

      let average = (array) => array.reduce((a, b) => a + b) / array.length;

      var measures = {};
      let ai_claim_pred = 0       // show-claimPrediction
      let attr_exp_models = 0     // show-claimConfidences
      let attr_exp_article = 0    // show-explanation
      let attn_exp_claim = 0      // show-claimWords
      let attn_exp_article = 0    // show-articleWords
      let top3_exp_article = 0    // show-articleTopSentences

      let true_seen =0
      let fake_seen =0 
      let true_prediction =0
      let false_prediction =0 
      let true_shared = 0
      let fake_shared = 0
      let true_reported = 0
      let fake_reported = 0
      let true_guess = 0 
      let false_guess = 0

      let user_agreement = 0
      let user_disagreement = 0
      let user_agreement_exp = 0
      let user_disagreement_exp = 0
      let story_skipped = 0
      let story_selected = 0
      let story_reported = 0
      let article_selected = 0
      let article_inspected = 0
      let perceived_accuracy = []
      let agreement_rate = []
      measures.task_done = 0
      measures.user_engmnt = 0
      measures.user_response = 0
      measures.perceived_accuracy = 0

      let agreement_type = [];
      let perc_acc_type = 0 
      let perc_acc_change = 0

      let study_start_time = 0         // done
      let study_end_time = 0           // left -- 
      total_survey_time = 0
      total_article_time = 0
      last_time_stamp = 0;
      total_idle = 0;
      exp_checked = [];
      ai_checked = [];

      for(let interaction of interactionsForParticipant) {
          
          if (study_start_time == 0 && (interaction.action == 'study_start'  || interaction.action == 'showQuestions')){
              taskRun = interaction.taskRun       // task-run to get the user id, condtions, etc. 
              for(let detailName in interaction.details) {
                if (detailName == 'timestamp') {
                  study_start_time = interaction.details[detailName]
                  last_time_stamp = study_start_time;
                }
              }
          }

          // non-survey actions
          if (all_surveys.includes(interaction.action) == false){



            if (interaction.action != 'showTopic') measures.user_engmnt++;

            // ----- skip a story  -----
            if (interaction.action == 'skippedStory') {
              if (interaction.details['credibility'].includes('true')) true_seen++;
              else fake_seen++;

              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              }else{
                false_prediction++;
              }

              story_skipped++;
            } 
            // ----- End skip story  -----

            // ----- select a story  -----
            if (interaction.action == 'selectedStory') {
              story_selected++;

              if (interaction.details['credibility'].includes('true')) {
                true_shared++;
                true_seen++;
              } else {
                fake_shared++;
                fake_seen++;
              }

              
              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {
                if (interaction.details['prediction'] == 'True') {
                  user_agreement++;
                  agreement_type.push(1);  // 1: agreement
                }
                if ((interaction.details['prediction'] == 'Fake') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement
                }

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }

              }else{   // did not checked AI

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }
              }


              // if ((interaction.details['prediction'] == 'True') && ai_checked.includes(interaction.details['claim_id']) ) user_agreement++;
              // if ((interaction.details['prediction'] == 'Fake') && ai_checked.includes(interaction.details['claim_id']) ) user_disagreement++;

              // if ((interaction.details['prediction'] == 'True') && exp_checked.includes(interaction.details['claim_id']) ) user_agreement_exp++;
              // if ((interaction.details['prediction'] == 'Fake') && exp_checked.includes(interaction.details['claim_id']) ) user_disagreement_exp++;

              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ){ 
                true_prediction++;
              }else{
                false_prediction++;
              }

            }
            // ----- End select a story  -----

            // ----- report a story  -----
            if (interaction.action == 'reportStory') {
              story_reported++;
              if (interaction.details['credibility'].includes('true')) {
                  true_reported++;    
                  true_seen++;
              } else {    
                 fake_reported++;    
                 fake_seen++;    
              }   

              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {
                if (interaction.details['prediction'] == 'Fake') {
                  user_agreement++;
                  agreement_type.push(1);  // 1: agreement
                }
                if ((interaction.details['prediction'] == 'True') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement
                }

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }

              }else{   // did not checked AI

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }
              }


              // if ((interaction.details['prediction'] == 'Fake') && ai_checked.includes(interaction.details['claim_id']) ) user_agreement++;
              // if ((interaction.details['prediction'] == 'True') && ai_checked.includes(interaction.details['claim_id']) ) user_disagreement++;

              // if ((interaction.details['prediction'] == 'Fake') && exp_checked.includes(interaction.details['claim_id']) ) user_agreement_exp++;
              // if ((interaction.details['prediction'] == 'True') && exp_checked.includes(interaction.details['claim_id']) ) user_disagreement_exp++;

           
              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              } else {
                false_prediction++;
              }

            }
            // ----- End report a story  -----

            // ----- Other than skip, share, and report: -----

            if (interaction.action == 'showArticle') article_inspected++;
            if (interaction.action == 'chooseArticle') article_selected++;
            
            if ((interaction.action == 'show-claimPrediction') && !ai_checked.includes(interaction.details['topic'])) {
              ai_claim_pred++; 
              ai_checked.push(interaction.details['topic'])
            }

            //  attn
            if ((interaction.action == 'show-claimWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_claim++;
              exp_checked.push(interaction.details['topic']);
            }
            if ((interaction.action == 'show-articleWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_article++;
              exp_checked.push(interaction.details['topic']);
            };

            //  attr
            if ((interaction.action == 'show-claimConfidences')  && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_models++;
              exp_checked.push(interaction.details['topic'])
            } 
            if ((interaction.action == 'show-explanation')   && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }
            if ((interaction.action == 'show-articleTopSentences')   && !exp_checked.includes(interaction.details['topic'])) {
              top3_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }

            true_list = ['true', 'true?','ture','tru']
            false_list = ['false','fake', 'fake?','false?']  

            if ((interaction.details['credibility']) && (interaction.action == 'userGuess')) {
              user_guess = interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase()  // .replace(/ /g, '').replace(/True?orFake?/g, '').toLowerCase()  //True? or Fake?
              if (true_list.includes(user_guess) && interaction.details['credibility'].includes('true')) true_guess++;
              else if (false_list.includes(user_guess) && interaction.details['credibility'].includes('false')) true_guess++;
              else if (!true_list.includes(user_guess) && !false_list.includes(user_guess)) console.log('new user guess comment:>>', interaction.details['guess'],'<<') // '-->>',interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase(),"<<");
              else false_guess++;
            } 

              
            
            study_end_time = interaction.details['timestamp']
            if ((study_end_time - last_time_stamp) / 60 > 3){          // --  3 minutes threshold idle 
              total_idle += study_end_time - last_time_stamp;
            }
            last_time_stamp = study_end_time;
          
          // ---- surveys actions  ---- 
          }else{

            // 'mid_survey_1', 'mid_survey_2', 'end_survey_1'
            for(let detailName in interaction.details) {
              if (detailName == 'mental_model_range' ) {
                  perceived_accuracy.push(parseInt(interaction.details[detailName]))
              }
            } 
            

            if (interaction.action == 'post_study_survey' || interaction.action == 'end_survey_2'){  
              measures.task_done = 'ture'

              for(let detailName in interaction.details) {
                if (response_forms.includes(detailName) )  {
                  measures.user_response += interaction.details[detailName].toString().split(" ").length;
                }

                if (detailName == 'mental_model_range' )  {
                    measures.perceived_accuracy = interaction.details[detailName] 
                }

              } 

            }
            for(let detailName in interaction.details) {
              if (detailName == 'timestamp') {
                study_end_time = interaction.details[detailName]
                total_survey_time += study_end_time - last_time_stamp;
                last_time_stamp = study_end_time
              }
            } 

          }
      } 

      
      measures.claim_inspected = story_skipped + story_selected + story_reported; 
      measures.article_inspected = article_inspected / (story_reported + story_selected); 
      
      measures.prediction_inspectin = ai_claim_pred / (story_reported + story_selected); 

      // console.log(ai_claim_pred, '==', (story_skipped + story_selected + story_reported),  '=!', (user_agreement + user_disagreement + story_skipped))
      
      // console.log(agreement_type.length, agreement_type, sum,agreement_type.slice(0,3))
      // console.log(slice_1, slice_2, slice_3, slice_1.length + slice_2.length + slice_3.length)

      measures.claim_exp_inspectin = (attr_exp_models + attn_exp_claim)  / (story_reported + story_selected); 
      // measures.claim_exp_inspectin_slc = (attr_exp_models + attn_exp_claim) / (story_selected);
      // measures.claim_exp_inspectin_skp = (attr_exp_models + attn_exp_claim) / (story_skipped);
      measures.artilce_exp_inspectin = (attr_exp_article + attn_exp_article + top3_exp_article)  / (story_reported + story_selected);

      measures.user_shared_veracity = true_shared / (true_shared + fake_shared);
      measures.user_reported_veracity = fake_reported / (true_reported + fake_reported);

      measures.user_agreement = user_agreement / (user_agreement + user_disagreement); // (story_reported + story_selected); // (true_shared + fake_reported);
      measures.user_agreement_exp = user_agreement_exp / (user_agreement_exp + user_disagreement_exp); // (story_reported + story_selected); // (true_shared + fake_reported);

      // console.log(true_guess, false_guess, true_guess / (true_guess + false_guess))
      measures.user_prediction = true_guess / (true_guess + false_guess)    // user prediction task 
      
      measures.news_veracity = true_seen / (true_seen + fake_seen);                        // check news veracity for all
      // true_prediction  >> TP and FN 
      // false_prediction  >> FP and TN  
      measures.model_accuracy = true_prediction / (true_prediction + false_prediction);    // check model accuracy for all
      
      // measures.user_engmnt 
      measures.task_duration = (study_end_time - study_start_time) / 60 - (total_idle / 60);  // total_article_time
      measures.payment = (measures.task_duration / 60) * 10;
      measures.total_survey_time = total_survey_time / 60;
      measures.total_article_time = measures.task_duration - measures.total_survey_time;

      measures.perceived_accuracy_avg = average(perceived_accuracy)
      perc_acc_change = perceived_accuracy[2] - perceived_accuracy[0];
      
      slice_1 = agreement_type.slice(0, (agreement_type.length / 3));
      slice_2 = agreement_type.slice((agreement_type.length / 3), 2*(agreement_type.length / 3));
      slice_3 = agreement_type.slice(2*(agreement_type.length / 3), agreement_type.length);
      // const sum = slice_2.reduce((partial_sum, a) => partial_sum + a,0) 
      // console.log(slice_1.length+slice_2.length+slice_3.length,agreement_type.length)
      
      slice_1_rate = 0;
      for (i=0;i<slice_1.length;i++){
          if (slice_1[i] == 1) slice_1_rate++;
      }
      agreement_rate.push(slice_1_rate / slice_1.length);

      slice_2_rate = 0;
      for (i=0;i<slice_2.length;i++){
          if (slice_2[i] == 1) slice_2_rate++;
      }
      agreement_rate.push(slice_2_rate / slice_2.length);

      slice_3_rate = 0;
      for (i=0;i<slice_3.length;i++){
          if (slice_3[i] == 1) slice_3_rate++;
      }
      agreement_rate.push(slice_3_rate / slice_3.length);

      // console.log(agreement_rate[0].toString().slice(0,3),slice_2_rate.toString().slice(0,3),slice_3_rate.toString().slice(0,3))
      // console.log(slice_1.reduce((partial_sum, a) => partial_sum + a,0), slice_2.reduce((partial_sum, a) => partial_sum + a,0) , slice_3.reduce((partial_sum, a) => partial_sum + a,0) )
      // console.log(perceived_accuracy[0],perceived_accuracy[1],perceived_accuracy[2])

      // Type 1: down-down 
      // Type 2: down-up
      // Type 3: up-up
      // Type 4: up-down
      // Type 5: same-same
      const acc_threshold = 2;
      if ((perceived_accuracy[0] > perceived_accuracy[1]) & (perceived_accuracy[1] > perceived_accuracy[2])) {
        perc_acc_type = 1;
      } else if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) & ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold)) {
        perc_acc_type = 2;
      } else if ((perceived_accuracy[0] < perceived_accuracy[1]) & (perceived_accuracy[1] < perceived_accuracy[2])) {
        perc_acc_type = 3;
      } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) & ((perceived_accuracy[1] - perceived_accuracy[2]) > acc_threshold)) {
        perc_acc_type = 4;
      } else {
        // if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) || ((perceived_accuracy[1] - perceived_accuracy[2]) > 3) ) {
          if ( (perceived_accuracy[0] - perceived_accuracy[2]) > 2 * acc_threshold) {
           perc_acc_type = 1;
           // } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) || ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold) ) {
          } else if ( (perceived_accuracy[2] - perceived_accuracy[0]) > 2 * acc_threshold ) {
            perc_acc_type = 3;
          } else {
            perc_acc_type = 5;
            console.log('no change!: ', perceived_accuracy);
          }
      }


      const agreement_threshold = 0.01;
      if ((agreement_rate[0] > agreement_rate[1]) & (agreement_rate[1] > agreement_rate[2])) {
        usr_agreement_type = 1;
      } else if (((agreement_rate[0] - agreement_rate[1]) > agreement_threshold) & ((agreement_rate[2] - agreement_rate[1]) > agreement_threshold)) {
        usr_agreement_type = 2;
      } else if ((agreement_rate[0] < agreement_rate[1]) & (agreement_rate[1] < agreement_rate[2])) {
        usr_agreement_type = 3;
      } else if (((agreement_rate[1] - agreement_rate[0]) > agreement_threshold) & ((agreement_rate[1] - agreement_rate[2]) > agreement_threshold)) {
        usr_agreement_type = 4;
      } else {
          if ( (agreement_rate[0] - agreement_rate[2]) > 2 * agreement_threshold) {
           usr_agreement_type = 1;
          } else if ( (agreement_rate[2] - agreement_rate[0]) > 2 * agreement_threshold ) {
            usr_agreement_type = 3;
          } else {
            usr_agreement_type = 5;
            console.log('no change!: ', agreement_rate);
          }
      } 
      usr_agreement_change = agreement_rate[2] - agreement_rate[0];

      csvString += taskRun.participant_id + ","
          // + taskRun.mturk_id + ","
          + taskRun.condition_order[taskRun.current_condition] + ","
          // + measures.task_done + ","

          + measures.task_duration.toString().slice(0,4) + ","
          // + measures.payment.toString().slice(0,4) + ","
          + measures.total_article_time.toString().slice(0,4) + ","
          + measures.total_survey_time.toString().slice(0,4) + ","
          + measures.user_engmnt + ","
          + measures.user_response + ","

          + measures.news_veracity.toString().slice(0,4) + ","
          + measures.model_accuracy.toString().slice(0,4) + ","

          + measures.user_shared_veracity.toString().slice(0,4) + ","
          + measures.user_reported_veracity.toString().slice(0,4) + ","
          + measures.claim_inspected.toString().slice(0,4) + ","
          + measures.article_inspected.toString().slice(0,4) + ","

          + measures.prediction_inspectin.toString().slice(0,4) + ","
          + measures.claim_exp_inspectin.toString().slice(0,4) + ","
          // + measures.claim_exp_inspectin_slc.toString().slice(0,4) + ","
          // + measures.claim_exp_inspectin_skp.toString().slice(0,4) + ","
          + measures.artilce_exp_inspectin.toString().slice(0,4) + ","

          + measures.user_prediction.toString().slice(0,4)+ ","
          + measures.user_agreement.toString().slice(0,4) + ","
          + measures.user_agreement_exp.toString().slice(0,4) + ","
          + measures.perceived_accuracy.toString().slice(0,4)
          + "<br/>"
   }
  res.send(csvString)
}

// ---  user trust and performance over time --> 3-points user reliance measures
logging.interactionAnalysisTimeOld = async (req, res) => {

  // const participantId = req.params.participantId

  var participantId = req.params.participantId
  var participantObjs = participantId.split(',');

  let csvString = "ID, condition, " + 
                  // "HIT duration,task duration,survey duration, user click , character count, " +   // engagement
                  // "news veracity, model accuracy," +                                               // model and news
                  // "user shared news, user reported news, claim checked, article checked, " +      // performance
                  // "model prediction checked,claim exp checked,artilce exp checked, " +             // usefulness
                  // "user prediction task (model), " +                                                // mental model
                  // "user agreement (model), user agreement (exp), perceived accuracy (last), " +     // trust
                  "perceived accuracy (last), " +     // trust
                  "trust type, trust over time, 1st measure, 2nd measure, 3rd measure," + // perceived accuracy in time
                  "user agreement," + 
                  "agreement type, agreement over time, 1st measure, 2nd measure, 3rd measure," + // user agreement in time
                  "shared true," + 
                  "shared type, shared over time, 1st measure, 2nd measure, 3rd measure," + // user agreement in time
                  "reported fake," + 
                  "reported type, reported over time, 1st measure, 2nd measure, 3rd measure" + // user agreement in time
                  " <br/>"

  for(let participant of participantObjs) {

      participantId = participant; 
      
      console.log('analysis for: ', participantId)


      let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
      let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()
      let taskRun;

      let all_surveys = ['mid_survey_1', 'mid_survey_2', 'end_survey_1', 'end_survey_2', 'survey_preStudy', 'post_study_survey']
      let response_forms = ['strategy', 'reasoning',  'limitation', 'additional']

      let average = (array) => array.reduce((a, b) => a + b) / array.length;

      var measures = {};
      let ai_claim_pred = 0       // show-claimPrediction
      let attr_exp_models = 0     // show-claimConfidences
      let attr_exp_article = 0    // show-explanation
      let attn_exp_claim = 0      // show-claimWords
      let attn_exp_article = 0    // show-articleWords
      let top3_exp_article = 0    // show-articleTopSentences

      let true_seen =0
      let fake_seen =0 
      let true_prediction =0
      let false_prediction =0 
      let true_shared = 0
      let fake_shared = 0
      let true_reported = 0
      let fake_reported = 0
      let true_guess = 0 
      let false_guess = 0

      let user_agreement = 0
      let user_disagreement = 0
      let user_agreement_exp = 0
      let user_disagreement_exp = 0
      let story_skipped = 0
      let story_selected = 0
      let story_reported = 0
      let article_selected = 0
      let article_inspected = 0
      let perceived_accuracy = [];
      

      measures.task_done = 0
      measures.user_engmnt = 0
      measures.user_response = 0
      measures.perceived_accuracy = 0

      let report_slice_1 = [];
      let report_slice_2 = [];
      let report_slice_3 = [];
      let report_rate = [];

      let performance_slice_1 = [];
      let performance_slice_2 = [];
      let performance_slice_3 = [];
      let performance_rate = [];

      let agreement_type = [];
      let agreement_slice_1 = [];
      let agreement_slice_2 = [];
      let agreement_slice_3 = [];
      let agreement_rate = [];
      
      let perc_acc_type = 0 
      let perc_acc_change = 0
      let conf_mat_slice_1 = [];
      let conf_mat_slice_2 = [];
      let conf_mat_slice_3 = [];

      let study_start_time = 0         // done
      let study_end_time = 0           // left -- 
      total_survey_time = 0
      total_article_time = 0
      last_time_stamp = 0;
      total_idle = 0;
      exp_checked = [];
      ai_checked = [];

      for(let interaction of interactionsForParticipant) {
          
          if (study_start_time == 0 && (interaction.action == 'study_start'  || interaction.action == 'showQuestions')){
              taskRun = interaction.taskRun       // task-run to get the user id, condtions, etc. 
              for(let detailName in interaction.details) {
                if (detailName == 'timestamp') {
                  study_start_time = interaction.details[detailName]
                  last_time_stamp = study_start_time;
                }
              }
          }

          // non-survey actions
          if (all_surveys.includes(interaction.action) == false){



            if (interaction.action != 'showTopic') measures.user_engmnt++;

            // ----- skip a story  -----
            if (interaction.action == 'skippedStory') {
              if (interaction.details['credibility'].includes('true')) true_seen++;
              else fake_seen++;

              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              }else{
                false_prediction++;
              }

              story_skipped++;
            } 
            // ----- End skip story  -----

            // ----- select a story  -----
            if (interaction.action == 'selectedStory') {
              // story_selected++;   <<--- moved to the end
                //  if (story_selected < 4){
                //     if (interaction.details['prediction'] == 'True') {
                //       performance_slice_1.push('TP');
                //     }else{
                //       performance_slice_1.push('FP');
                //     }
                // }else if (story_selected < 8){
                //     if (interaction.details['prediction'] == 'True') {
                //       performance_slice_2.push('TP');
                //     }else{
                //       performance_slice_2.push('FP');
                //     }
                // }else{
                //       performance_slice_1.push('TP');
                // }

              //  TP: share a true news
              //  FP: share a fake news
              //  TN: report a fake news
              //  FN: report a true news 

              if (interaction.details['credibility'].includes('true')) {
                true_shared++;
                true_seen++;
                
                if (story_selected < 4){
                  performance_slice_1.push('TP');
                }else if (story_selected < 8){
                  performance_slice_2.push('TP');
                }else{
                  performance_slice_3.push('TP');
                }

                
              } else {
                fake_shared++;
                fake_seen++;

                if (story_selected < 4){
                  performance_slice_1.push('FP');
                }else if (story_selected < 8){
                  performance_slice_2.push('FP');
                }else{
                  performance_slice_3.push('FP');
                }

              }

              
              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {
                if (interaction.details['prediction'] == 'True') {
                  user_agreement++;
                  agreement_type.push(1);  // -1: disagreement
                  if (story_selected < 4){
                    agreement_slice_1.push(1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(1);  // 1: agreement
                  }

                }
                if ((interaction.details['prediction'] == 'Fake') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement
                  if (story_selected < 4){
                    agreement_slice_1.push(-1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(-1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(-1);  // 1: agreement
                  }
                }


                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }

              }else{   // did not checked AI

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }
              }


              // if ((interaction.details['prediction'] == 'True') && ai_checked.includes(interaction.details['claim_id']) ) user_agreement++;
              // if ((interaction.details['prediction'] == 'Fake') && ai_checked.includes(interaction.details['claim_id']) ) user_disagreement++;

              // if ((interaction.details['prediction'] == 'True') && exp_checked.includes(interaction.details['claim_id']) ) user_agreement_exp++;
              // if ((interaction.details['prediction'] == 'Fake') && exp_checked.includes(interaction.details['claim_id']) ) user_disagreement_exp++;

              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ){ 
                true_prediction++;
              }else{
                false_prediction++;
              }

            story_selected++; 
            }
            // ----- End select a story  -----

            
            

            // ----- report a story  -----
            if (interaction.action == 'reportStory') {
              story_reported++;
              if (interaction.details['credibility'].includes('true')) {
                  true_reported++;    
                  true_seen++;

                if (story_selected < 4){
                  report_slice_1.push('FN');
                }else if (story_selected < 8){
                  report_slice_2.push('FN');
                }else{
                  report_slice_3.push('FN');
                }

              } else {    
                 fake_reported++;    
                 fake_seen++;    

                if (story_selected < 4){
                  report_slice_1.push('TN');
                }else if (story_selected < 8){
                  report_slice_2.push('TN');
                }else{
                  report_slice_3.push('TN');
                }
              }   

              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {
                if (interaction.details['prediction'] == 'Fake') {
                  user_agreement++;
                  agreement_type.push(1);  // 1: agreement
                  if (story_selected < 4){
                    agreement_slice_1.push(1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(1);  // 1: agreement
                  }
                }
                if ((interaction.details['prediction'] == 'True') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement
                  if (story_selected < 4){
                    agreement_slice_1.push(-1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(-1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(-1);  // 1: agreement
                  }
                }

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }

              }else{   // did not checked AI

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }
              }


              // if ((interaction.details['prediction'] == 'Fake') && ai_checked.includes(interaction.details['claim_id']) ) user_agreement++;
              // if ((interaction.details['prediction'] == 'True') && ai_checked.includes(interaction.details['claim_id']) ) user_disagreement++;

              // if ((interaction.details['prediction'] == 'Fake') && exp_checked.includes(interaction.details['claim_id']) ) user_agreement_exp++;
              // if ((interaction.details['prediction'] == 'True') && exp_checked.includes(interaction.details['claim_id']) ) user_disagreement_exp++;

           
              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              } else {
                false_prediction++;
              }

            }
            // ----- End report a story  -----

            // ----- Other than skip, share, and report: -----

            if (interaction.action == 'showArticle') article_inspected++;
            if (interaction.action == 'chooseArticle') article_selected++;
            
            if ((interaction.action == 'show-claimPrediction') && !ai_checked.includes(interaction.details['topic'])) {
              ai_claim_pred++; 
              ai_checked.push(interaction.details['topic'])
            }

            //  attn
            if ((interaction.action == 'show-claimWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_claim++;
              exp_checked.push(interaction.details['topic']);
            }
            if ((interaction.action == 'show-articleWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_article++;
              exp_checked.push(interaction.details['topic']);
            };

            //  attr
            if ((interaction.action == 'show-claimConfidences')  && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_models++;
              exp_checked.push(interaction.details['topic'])
            } 
            if ((interaction.action == 'show-explanation')   && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }
            if ((interaction.action == 'show-articleTopSentences')   && !exp_checked.includes(interaction.details['topic'])) {
              top3_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }

            true_list = ['true', 'true?','ture','tru']
            false_list = ['false','fake', 'fake?','false?']  

            if ((interaction.details['credibility']) && (interaction.action == 'userGuess')) {
              user_guess = interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase()  // .replace(/ /g, '').replace(/True?orFake?/g, '').toLowerCase()  //True? or Fake?
              if (true_list.includes(user_guess) && interaction.details['credibility'].includes('true')) true_guess++;
              else if (false_list.includes(user_guess) && interaction.details['credibility'].includes('false')) true_guess++;
              else if (!true_list.includes(user_guess) && !false_list.includes(user_guess)) console.log('new user guess comment:>>', interaction.details['guess'],'<<') // '-->>',interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase(),"<<");
              else false_guess++;
            } 

              
            
            study_end_time = interaction.details['timestamp']
            if ((study_end_time - last_time_stamp) / 60 > 3){          // --  3 minutes threshold idle 
              total_idle += study_end_time - last_time_stamp;
            }
            last_time_stamp = study_end_time;
          
          // ---- surveys actions  ---- 
          }else{

            // 'mid_survey_1', 'mid_survey_2', 'end_survey_1'
            for(let detailName in interaction.details) {
              if (detailName == 'mental_model_range' ) {
                  perceived_accuracy.push(parseInt(interaction.details[detailName]))
              }
            } 
            

            if (interaction.action == 'post_study_survey' || interaction.action == 'end_survey_2'){  
              measures.task_done = 'ture'

              for(let detailName in interaction.details) {
                if (response_forms.includes(detailName) )  {
                  measures.user_response += interaction.details[detailName].toString().split(" ").length;
                }

                if (detailName == 'mental_model_range' )  {
                    measures.perceived_accuracy = interaction.details[detailName] 
                }

              } 

            }
            for(let detailName in interaction.details) {
              if (detailName == 'timestamp') {
                study_end_time = interaction.details[detailName]
                total_survey_time += study_end_time - last_time_stamp;
                last_time_stamp = study_end_time
              }
            } 

          }
      } 

      
      measures.claim_inspected = story_skipped + story_selected + story_reported; 
      measures.article_inspected = article_inspected / (story_reported + story_selected); 
      
      measures.prediction_inspectin = ai_claim_pred / (story_reported + story_selected); 

      // console.log(ai_claim_pred, '==', (story_skipped + story_selected + story_reported),  '=!', (user_agreement + user_disagreement + story_skipped))

      measures.claim_exp_inspectin = (attr_exp_models + attn_exp_claim)  / (story_reported + story_selected); 
      // measures.claim_exp_inspectin_slc = (attr_exp_models + attn_exp_claim) / (story_selected);
      // measures.claim_exp_inspectin_skp = (attr_exp_models + attn_exp_claim) / (story_skipped);
      measures.artilce_exp_inspectin = (attr_exp_article + attn_exp_article + top3_exp_article)  / (story_reported + story_selected);

      measures.user_shared_veracity = true_shared / (true_shared + fake_shared);
      // console.log(true_shared, fake_shared)
      measures.user_reported_veracity = fake_reported / (true_reported + fake_reported);

      measures.user_agreement = user_agreement / (user_agreement + user_disagreement); // (story_reported + story_selected); // (true_shared + fake_reported);
      measures.user_agreement_exp = user_agreement_exp / (user_agreement_exp + user_disagreement_exp); // (story_reported + story_selected); // (true_shared + fake_reported);

      // console.log(true_guess, false_guess, true_guess / (true_guess + false_guess))
      measures.user_prediction = true_guess / (true_guess + false_guess)    // user prediction task 
      
      measures.news_veracity = true_seen / (true_seen + fake_seen);                        // check news veracity for all
      measures.model_accuracy = true_prediction / (true_prediction + false_prediction);    // check model accuracy for all
      // measures.user_engmnt 
      measures.task_duration = (study_end_time - study_start_time) / 60 - (total_idle / 60);  // total_article_time
      measures.payment = (measures.task_duration / 60) * 10;
      measures.total_survey_time = total_survey_time / 60;
      measures.total_article_time = measures.task_duration - measures.total_survey_time;

      measures.perceived_accuracy_avg = average(perceived_accuracy)
      perc_acc_change = perceived_accuracy[2] - perceived_accuracy[0];
      
      
      //  TP: share a true news
      //  FP: share a fake news
      //  TN: report a fake news
      //  FN: report a true news 
      tot_result_TP = 0;
      tot_result_FP = 0;
      result_TP = performance_slice_1.filter(i => i === "TP").length; 
      result_FP = performance_slice_1.filter(i => i === "FP").length;
      tot_result_TP += result_TP;
      tot_result_FP += result_FP
      performance_rate.push(result_TP/(result_TP+result_FP));
      result_TP = performance_slice_2.filter(i => i === "TP").length; 
      result_FP = performance_slice_2.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));
      result_TP = performance_slice_3.filter(i => i === "TP").length; 
      result_FP = performance_slice_3.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));
      // console.log('user_shared_veracity: ', performance_rate, measures.user_shared_veracity, performance_rate.reduce((partial_sum, a) => partial_sum + a,0)/3)
      // console.log(performance_slice_1,performance_slice_2,performance_slice_3)

      //  TP: share a true news
      //  FP: share a fake news
      //  TN: report a fake news
      //  FN: report a true news 
      rate = 0;
      result_TN = report_slice_1.filter(i => i === "TN").length; 
      result_FN = report_slice_1.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {
        rate = result_TN/(result_TN+result_FN)
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }
      result_TN = report_slice_2.filter(i => i === "TN").length; 
      result_FN = report_slice_2.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {
        rate = result_TN/(result_TN+result_FN)
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }
      result_TN = report_slice_3.filter(i => i === "TN").length; 
      result_FN = report_slice_3.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {
        rate = result_TN/(result_TN+result_FN)
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }
      // console.log('user_fake_reported: ', report_rate, measures.user_reported_veracity, report_rate.reduce((partial_sum, a) => partial_sum + a,0)/3)
      // console.log(report_slice_1,report_slice_2,report_slice_3)



      agreement_rate.push(agreement_slice_1.filter(i => i === 1).length / agreement_slice_1.length);
      agreement_rate.push(agreement_slice_2.filter(i => i === 1).length / agreement_slice_2.length);
      agreement_rate.push(agreement_slice_3.filter(i => i === 1).length / agreement_slice_3.length);

      // console.log('agreement_rate:  ', agreement_slice_1, agreement_slice_2, agreement_slice_3);
      // console.log(performance_slice_1,performance_slice_2,performance_slice_3)
      // console.log(slice_1.reduce((partial_sum, a) => partial_sum + a,0), slice_2.reduce((partial_sum, a) => partial_sum + a,0) , slice_3.reduce((partial_sum, a) => partial_sum + a,0) )
      // console.log(perceived_accuracy[0],perceived_accuracy[1],perceived_accuracy[2])

      // Type 1: down-down 
      // Type 2: down-up
      // Type 3: up-up
      // Type 4: up-down
      // Type 5: same-same
      const acc_threshold = 2;
      if ((perceived_accuracy[0] > perceived_accuracy[1]) & (perceived_accuracy[1] > perceived_accuracy[2])) {
        perc_acc_type = 1;
      } else if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) & ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold)) {
        perc_acc_type = 2;
      } else if ((perceived_accuracy[0] < perceived_accuracy[1]) & (perceived_accuracy[1] < perceived_accuracy[2])) {
        perc_acc_type = 3;
      } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) & ((perceived_accuracy[1] - perceived_accuracy[2]) > acc_threshold)) {
        perc_acc_type = 4;
      } else {
        // if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) || ((perceived_accuracy[1] - perceived_accuracy[2]) > 3) ) {
          if ( (perceived_accuracy[0] - perceived_accuracy[2]) > 2 * acc_threshold) {
           perc_acc_type = 1;
           // } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) || ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold) ) {
          } else if ( (perceived_accuracy[2] - perceived_accuracy[0]) > 2 * acc_threshold ) {
            perc_acc_type = 3;
          } else {
            perc_acc_type = 5;
            console.log('no change!: ', perceived_accuracy);
          }
      }


      const agreement_threshold = 0.01;
      if ((agreement_rate[0] > agreement_rate[1]) & (agreement_rate[1] > agreement_rate[2])) {
        usr_agreement_type = 1;
      } else if (((agreement_rate[0] - agreement_rate[1]) > agreement_threshold) & ((agreement_rate[2] - agreement_rate[1]) > agreement_threshold)) {
        usr_agreement_type = 2;
      } else if ((agreement_rate[0] < agreement_rate[1]) & (agreement_rate[1] < agreement_rate[2])) {
        usr_agreement_type = 3;
      } else if (((agreement_rate[1] - agreement_rate[0]) > agreement_threshold) & ((agreement_rate[1] - agreement_rate[2]) > agreement_threshold)) {
        usr_agreement_type = 4;
      } else {
          if ( (agreement_rate[0] - agreement_rate[2]) > 2 * agreement_threshold) {
           usr_agreement_type = 1;
          } else if ( (agreement_rate[2] - agreement_rate[0]) > 2 * agreement_threshold ) {
            usr_agreement_type = 3;
          } else {
            usr_agreement_type = 5;
            console.log('no change!: ', agreement_rate);
          }
      } 
      usr_agreement_change = agreement_rate[2] - agreement_rate[0];

      const performance_threshold = 0.01;
      if ((performance_rate[0] > performance_rate[1]) & (performance_rate[1] > performance_rate[2])) {
        performance_type = 1;
      } else if (((performance_rate[0] - performance_rate[1]) > performance_threshold) & ((performance_rate[2] - performance_rate[1]) > agreement_threshold)) {
        performance_type = 2;
      } else if ((performance_rate[0] < performance_rate[1]) & (performance_rate[1] < performance_rate[2])) {
        performance_type = 3;
      } else if (((performance_rate[1] - performance_rate[0]) > performance_threshold) & ((performance_rate[1] - performance_rate[2]) > agreement_threshold)) {
        performance_type = 4;
      } else {
          if ( (performance_rate[0] - performance_rate[2]) > 2 * performance_threshold) {
           performance_type = 1;
          } else if ( (performance_rate[2] - performance_rate[0]) > 2 * performance_threshold ) {
            performance_type = 3;
          } else {
            performance_type = 5;
            console.log('no change!: ', performance_rate);
          }
      } 
      performance_change = performance_rate[2] - performance_rate[0];
      

      if ((report_rate[0] > report_rate[1]) & (report_rate[1] > report_rate[2])) {
        report_type = 1;
      } else if (((report_rate[0] - report_rate[1]) > performance_threshold) & ((report_rate[2] - report_rate[1]) > agreement_threshold)) {
        report_type = 2;
      } else if ((report_rate[0] < report_rate[1]) & (report_rate[1] < report_rate[2])) {
        report_type = 3;
      } else if (((report_rate[1] - report_rate[0]) > performance_threshold) & ((report_rate[1] - report_rate[2]) > agreement_threshold)) {
        report_type = 4;
      } else {
          if ( (report_rate[0] - report_rate[2]) > 2 * performance_threshold) {
           report_type = 1;
          } else if ( (report_rate[2] - report_rate[0]) > 2 * performance_threshold ) {
            report_type = 3;
          } else {
            report_type = 5;
            console.log('no change!: ', report_rate);
          }
      } 
      report_change = report_rate[2] - report_rate[0];
      

      // console.log(performance_type, performance_rate[2],performance_rate[1], performance_rate[0])
      // console.log(report_type, report_rate[2],report_rate[1], report_rate[0])

      csvString += taskRun.participant_id + ","
          + taskRun.condition_order[taskRun.current_condition] + ","
          // + measures.prediction_inspectin.toString().slice(0,4) + ","
          // + measures.user_prediction.toString().slice(0,4)+ ","
          + measures.perceived_accuracy.toString().slice(0,4) + ","
          + perc_acc_type + ","
          + perc_acc_change + ","
          + perceived_accuracy[0] + ","+ perceived_accuracy[1] + ","+ perceived_accuracy[2] + ","
          + measures.user_agreement.toString().slice(0,4) + ","
          + usr_agreement_type + ","
          + usr_agreement_change.toString().slice(0,5) + ","
          + agreement_rate[0].toString().slice(0,4) + "," + agreement_rate[1].toString().slice(0,4) + "," + agreement_rate[2].toString().slice(0,4) + ","

          + measures.user_shared_veracity.toString().slice(0,4) + ","
          + performance_type + ","
          + performance_change.toString().slice(0,5) + "," 
          + performance_rate[0].toString().slice(0,4) + "," + performance_rate[1].toString().slice(0,4) + "," + performance_rate[2].toString().slice(0,4) + ","
          + measures.user_reported_veracity.toString().slice(0,4) + ","
          + report_type + ","
          + report_change.toString().slice(0,5) + "," 
          + report_rate[0].toString().slice(0,4) + "," + report_rate[1].toString().slice(0,4) + "," + report_rate[2].toString().slice(0,4)//  + ","
          // + con_martix[0].toString() + "," + con_martix[1].toString() + "," + con_martix[2].toString()
          + "<br/>"
   }

  res.send(csvString)
}


// ---  user trust and performance over time --> 3 and 12-points user reliance measures
logging.TrustAnalysisTime = async (req, res) => {

  // const participantId = req.params.participantId

  var participantId = req.params.participantId
  var participantObjs = participantId.split(',');
  let count_cor = 0;
  let precision_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};
      // let recall_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};

  let csvString = "ID, condition, " + 
                  "perceived accuracy (last), " +     // trust
                  "trust type, trust over time, T1-T2, T2-T3, T1, T2, T3," + // perceived accuracy in time
                  "user agreement," + 
                  "agreement type, agreement over time, T1-T2, T2-T3, T1, T2,T3, T1, T2,T3,T4,T5,T6,T7,T8,T9,T10,T11,T12," + // user agreement in time
                  "user reliance," + 
                  "reliance type, reliance over time, T1-T2, T2-T3, T1, T2,T3, T1, T2,T3,T4,T5,T6,T7,T8,T9,T10,T11,T12," + // user agreement in time
                  "T1-2, T2-3,T3-4,T4-5,T5-6,T6-7,T7-8,T8-9,T9-10,T10-11,T11-12" + // user agreement in time
                  " <br/>"


  for(let participant of participantObjs) {

      participantId = participant; 
      
      console.log('analysis done: ', participantId)


      let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
      let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()
      let taskRun;

      let all_surveys = ['mid_survey_1', 'mid_survey_2', 'end_survey_1', 'end_survey_2', 'survey_preStudy', 'post_study_survey']
      let response_forms = ['strategy', 'reasoning',  'limitation', 'additional']

      let average = (array) => array.reduce((a, b) => a + b) / array.length;

      var measures = {};
      let ai_claim_pred = 0       // show-claimPrediction
      let attr_exp_models = 0     // show-claimConfidences
      let attr_exp_article = 0    // show-explanation
      let attn_exp_claim = 0      // show-claimWords
      let attn_exp_article = 0    // show-articleWords
      let top3_exp_article = 0    // show-articleTopSentences

      let true_seen =0
      let fake_seen =0 
      let true_prediction =0
      let false_prediction =0 
      let true_shared = 0
      let fake_shared = 0
      let true_reported = 0
      let fake_reported = 0
      let true_guess = 0 
      let false_guess = 0

      let user_agreement = 0
      let user_disagreement = 0
      let user_agreement_exp = 0
      let user_disagreement_exp = 0
      let story_skipped = 0
      let story_selected = 0
      let story_reported = 0
      let article_selected = 0
      let article_inspected = 0
      let perceived_accuracy = [];
      

      measures.task_done = 0
      measures.user_engmnt = 0
      measures.user_response = 0
      measures.perceived_accuracy = 0

      let report_slice_1 = [];
      let report_slice_2 = [];
      let report_slice_3 = [];
      let report_rate = [];

      let performance_slice_1 = [];
      let performance_slice_2 = [];
      let performance_slice_3 = [];
      let performance_rate = [];
    
      let accuracy_rate = [];      

      let agreement_type = [];
      let agreement_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};
      let agreement_slice_1 = [];
      let agreement_slice_2 = [];
      let agreement_slice_3 = [];
      let agreement_rate = [];


      let reliance_type = [];
      let reliance_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};
      let reliance_slice_1 = [];
      let reliance_slice_2 = [];
      let reliance_slice_3 = [];
      let reliance_rate = [];
      
      let perc_acc_type = 0 
      let perc_acc_change = 0
      let conf_mat_slice_1 = [];
      let conf_mat_slice_2 = [];
      let conf_mat_slice_3 = [];

      let engagement_slices  = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};
      let engagement_rate = [];

      let study_start_time = 0         // done
      let study_end_time = 0           // left -- 
      total_survey_time = 0
      total_article_time = 0
      last_time_stamp = 0;
      total_idle = 0;
      exp_checked = [];
      ai_checked = [];

      for(let interaction of interactionsForParticipant) {
          
          if (study_start_time == 0 && (interaction.action == 'study_start'  || interaction.action == 'showQuestions')){
              taskRun = interaction.taskRun       // task-run to get the user id, condtions, etc. 
              for(let detailName in interaction.details) {
                if (detailName == 'timestamp') {
                  study_start_time = interaction.details[detailName]
                  last_time_stamp = study_start_time;
                }
              }
          }

          // non-survey actions
          if (all_surveys.includes(interaction.action) == false){

            if (interaction.action != 'showTopic') measures.user_engmnt++;

            // ----- skip a story  -----
            if (interaction.action == 'skippedStory') {
              if (interaction.details['credibility'].includes('true')) true_seen++;
              else fake_seen++;

              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              }else{
                false_prediction++;
              }

              story_skipped++;
            } 
            // ----- End skip story  -----

            // ----- select a story  -----
            if (interaction.action == 'selectedStory') {
              // console.log("Select T"+(story_selected+1))
              // console.log(agreement_slices["T"+(story_selected+1)])
              //  TP: share a true news
              //  FP: share a fake news
              //  TN: report a fake news
              //  FN: report a true news 

              if (interaction.details['credibility'].includes('true')) {
                true_shared++;
                true_seen++;
                  
                  if (story_selected < 12){
                    precision_slices["T"+(story_selected+1)].push('TP');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('TP');
                  }

                if (story_selected < 4){
                  performance_slice_1.push('TP');
                }else if (story_selected < 8){
                  performance_slice_2.push('TP');
                }else{
                  performance_slice_3.push('TP');
                }

                
              } else {
                fake_shared++;
                fake_seen++;

                if (story_selected < 12){
                  precision_slices["T"+(story_selected+1)].push('FP');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('FP');
                  }

                if (story_selected < 4){
                  performance_slice_1.push('FP');
                }else if (story_selected < 8){
                  performance_slice_2.push('FP');
                }else{
                  performance_slice_3.push('FP');
                }

              }

              
              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {
                if (interaction.details['prediction'] == 'True') {
                  user_agreement++;
                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(1);
                  engagement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }

                  agreement_type.push(1);  // -1: disagreement
                  if (story_selected < 4){
                    agreement_slice_1.push(1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(1);  // 1: agreement
                  }

                }
                if ((interaction.details['prediction'] == 'Fake') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement

                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(-1);
                  engagement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(-1);
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }

                  if (story_selected < 4){
                    agreement_slice_1.push(-1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(-1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(-1);  // 1: agreement
                  }
                }


                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }

              }else{   // -- did not checked AI --

                if (story_selected < 12){
                  engagement_slices["T"+(story_selected+1)].push(0);
                  }else{
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(0);
                  }

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }
              }


              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ){ 
                true_prediction++;
              }else{
                false_prediction++;
              }

            // console.log(story_selected)
            story_selected++; 
            }
            // ----- End select a story  -----


            // ----- report a story  -----
            if (interaction.action == 'reportStory') {
              story_reported++;
              if (interaction.details['credibility'].includes('true')) {
                  true_reported++;    
                  true_seen++;

                if (story_selected < 12){
                  precision_slices["T"+(story_selected+1)].push('FN');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('FN');
                }

                if (story_selected < 4){
                  report_slice_1.push('FN');
                }else if (story_selected < 8){
                  report_slice_2.push('FN');
                }else{
                  report_slice_3.push('FN');
                }

              } else {    
                 fake_reported++;    
                 fake_seen++;    

                 if (story_selected < 12){
                  precision_slices["T"+(story_selected+1)].push('TN');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('TN');
                }

                if (story_selected < 4){
                  report_slice_1.push('TN');
                }else if (story_selected < 8){
                  report_slice_2.push('TN');
                }else{
                  report_slice_3.push('TN');
                }
              }   

              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {
                if (interaction.details['prediction'] == 'Fake') {
                  user_agreement++;
                  agreement_type.push(1);  // 1: agreement
                  
                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(1);
                  engagement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }

                  if (story_selected < 4){
                    agreement_slice_1.push(1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(1);  // 1: agreement
                  }
                }
                if ((interaction.details['prediction'] == 'True') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement
                  

                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(-1);
                  engagement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(-1);
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }


                  if (story_selected < 4){
                    agreement_slice_1.push(-1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(-1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(-1);  // 1: agreement
                  }

                }

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }

              }else{   // did not checked AI

                if (story_selected < 12){
                    engagement_slices["T"+(story_selected+1)].push(0);
                  }else{
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(0);
                  }

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }
              }


              // if ((interaction.details['prediction'] == 'Fake') && ai_checked.includes(interaction.details['claim_id']) ) user_agreement++;
              // if ((interaction.details['prediction'] == 'True') && ai_checked.includes(interaction.details['claim_id']) ) user_disagreement++;

              // if ((interaction.details['prediction'] == 'Fake') && exp_checked.includes(interaction.details['claim_id']) ) user_agreement_exp++;
              // if ((interaction.details['prediction'] == 'True') && exp_checked.includes(interaction.details['claim_id']) ) user_disagreement_exp++;

           
              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              } else {
                false_prediction++;
              }

            }
            // ----- End report a story  -----

            // ----- Other than skip, share, and report: -----

            if (interaction.action == 'showArticle') article_inspected++;
            if (interaction.action == 'chooseArticle') article_selected++;
            
            if ((interaction.action == 'show-claimPrediction') && !ai_checked.includes(interaction.details['topic'])) {
              ai_claim_pred++; 
              ai_checked.push(interaction.details['topic'])
            }

            //  attn
            if ((interaction.action == 'show-claimWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_claim++;
              exp_checked.push(interaction.details['topic']);
            }
            if ((interaction.action == 'show-articleWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_article++;
              exp_checked.push(interaction.details['topic']);
            };

            //  attr
            if ((interaction.action == 'show-claimConfidences')  && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_models++;
              exp_checked.push(interaction.details['topic'])
            } 
            if ((interaction.action == 'show-explanation')   && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }
            if ((interaction.action == 'show-articleTopSentences')   && !exp_checked.includes(interaction.details['topic'])) {
              top3_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }

            true_list = ['true', 'true?','ture','tru']
            false_list = ['false','fake', 'fake?','false?']  

            if ((interaction.details['credibility']) && (interaction.action == 'userGuess')) {
              user_guess = interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase()  // .replace(/ /g, '').replace(/True?orFake?/g, '').toLowerCase()  //True? or Fake?
              if (true_list.includes(user_guess) && interaction.details['credibility'].includes('true')) true_guess++;
              else if (false_list.includes(user_guess) && interaction.details['credibility'].includes('false')) true_guess++;
              else if (!true_list.includes(user_guess) && !false_list.includes(user_guess)) console.log('new user guess comment:>>', interaction.details['guess'],'<<') // '-->>',interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase(),"<<");
              else false_guess++;
            } 

              
            
            study_end_time = interaction.details['timestamp']
            if ((study_end_time - last_time_stamp) / 60 > 3){          // --  3 minutes threshold idle 
              total_idle += study_end_time - last_time_stamp;
            }
            last_time_stamp = study_end_time;
          
          // ---- surveys actions  ---- 
          }else{

            // 'mid_survey_1', 'mid_survey_2', 'end_survey_1'
            for(let detailName in interaction.details) {
              if (detailName == 'mental_model_range' ) {
                  perceived_accuracy.push(parseInt(interaction.details[detailName]))
              }
            } 
            

            if (interaction.action == 'post_study_survey' || interaction.action == 'end_survey_2'){  
              measures.task_done = 'ture'

              for(let detailName in interaction.details) {
                if (response_forms.includes(detailName) )  {
                  measures.user_response += interaction.details[detailName].toString().split(" ").length;
                }

                if (detailName == 'mental_model_range' )  {
                    measures.perceived_accuracy = interaction.details[detailName] 
                }

              } 

            }
            for(let detailName in interaction.details) {
              if (detailName == 'timestamp') {
                study_end_time = interaction.details[detailName]
                total_survey_time += study_end_time - last_time_stamp;
                last_time_stamp = study_end_time
              }
            } 

          }
          // ---- End of surveys actions  ---- 
      }
      // ---- End of all interactions  ---- 

      // console.log('agreement_slices: ', agreement_slices)
      
      measures.claim_inspected = story_skipped + story_selected + story_reported; 
      measures.article_inspected = article_inspected / (story_reported + story_selected); 
      
      measures.prediction_inspectin = ai_claim_pred / (story_reported + story_selected); 

      // console.log(ai_claim_pred, '==', (story_skipped + story_selected + story_reported),  '=!', (user_agreement + user_disagreement + story_skipped))

      measures.claim_exp_inspectin = (attr_exp_models + attn_exp_claim)  / (story_reported + story_selected); 
      // measures.claim_exp_inspectin_slc = (attr_exp_models + attn_exp_claim) / (story_selected);
      // measures.claim_exp_inspectin_skp = (attr_exp_models + attn_exp_claim) / (story_skipped);
      measures.artilce_exp_inspectin = (attr_exp_article + attn_exp_article + top3_exp_article)  / (story_reported + story_selected);

      measures.user_shared_veracity = true_shared / (true_shared + fake_shared);
      // console.log(true_shared, fake_shared)
      measures.user_reported_veracity = fake_reported / (true_reported + fake_reported);

      measures.user_agreement = user_agreement / (user_agreement + user_disagreement); // (story_reported + story_selected); // (true_shared + fake_reported);
      measures.user_agreement_exp = user_agreement_exp / (user_agreement_exp + user_disagreement_exp); // (story_reported + story_selected); // (true_shared + fake_reported);

      // console.log(true_guess, false_guess, true_guess / (true_guess + false_guess))
      measures.user_prediction = true_guess / (true_guess + false_guess)    // user prediction task 
      
      measures.news_veracity = true_seen / (true_seen + fake_seen);                        // check news veracity for all
      measures.model_accuracy = true_prediction / (true_prediction + false_prediction);    // check model accuracy for all
      // measures.user_engmnt 
      measures.task_duration = (study_end_time - study_start_time) / 60 - (total_idle / 60);  // total_article_time
      measures.payment = (measures.task_duration / 60) * 10;
      measures.total_survey_time = total_survey_time / 60;
      measures.total_article_time = measures.task_duration - measures.total_survey_time;

      
      
      
      // --- Precision in Time --- 

      


      //  TP: share a true news
      //  FP: share a fake news
      result_TP = performance_slice_1.filter(i => i === "TP").length; 
      result_FP = performance_slice_1.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));
      result_TP = performance_slice_2.filter(i => i === "TP").length; 
      result_FP = performance_slice_2.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));
      result_TP = performance_slice_3.filter(i => i === "TP").length; 
      result_FP = performance_slice_3.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));    // <<-- Precision of shared true news

      // console.log('user_shared_veracity: ', performance_rate, measures.user_shared_veracity, performance_rate.reduce((partial_sum, a) => partial_sum + a,0)/3)
      // console.log(performance_slice_1,performance_slice_2,performance_slice_3)



      //  TN: report a fake news
      //  FN: report a true news 
      rate = 0;
      result_TN = report_slice_1.filter(i => i === "TN").length; 
      result_FN = report_slice_1.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {
        rate = result_TN/(result_TN+result_FN)
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }
      result_TN = report_slice_2.filter(i => i === "TN").length; 
      result_FN = report_slice_2.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {  
        rate = result_TN/(result_TN+result_FN)
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }
      result_TN = report_slice_3.filter(i => i === "TN").length; 
      result_FN = report_slice_3.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {
        rate = result_TN/(result_TN+result_FN)   // <<-- Precision of reported fake news
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }  
      // console.log('user_fake_reported: ', report_rate, measures.user_reported_veracity, report_rate.reduce((partial_sum, a) => partial_sum + a,0)/3)
      // console.log(report_slice_1,report_slice_2,report_slice_3)

      result_TN = report_slice_1.filter(i => i === "TN").length; 
      result_FN = report_slice_1.filter(i => i === "FN").length;
      result_TP = performance_slice_1.filter(i => i === "TP").length; 
      result_FP = performance_slice_1.filter(i => i === "FP").length;

      total_accuracy = (result_TP + result_TN)/(result_TP+result_TN+result_FP+result_FN);
      accuracy_rate.push(total_accuracy)

      result_TN = report_slice_2.filter(i => i === "TN").length; 
      result_FN = report_slice_2.filter(i => i === "FN").length;
      result_TP = performance_slice_2.filter(i => i === "TP").length; 
      result_FP = performance_slice_2.filter(i => i === "FP").length;

      total_accuracy = (result_TP + result_TN)/(result_TP+result_TN+result_FP+result_FN);
      accuracy_rate.push(total_accuracy)

      result_TN = report_slice_3.filter(i => i === "TN").length; 
      result_FN = report_slice_3.filter(i => i === "FN").length;
      result_TP = performance_slice_3.filter(i => i === "TP").length; 
      result_FP = performance_slice_3.filter(i => i === "FP").length;

      total_accuracy = (result_TP + result_TN)/(result_TP+result_TN+result_FP+result_FN);
      accuracy_rate.push(total_accuracy)

      for (i=0;i<12;i++){ 
          this_index = "T"+(i+1);
          if (engagement_slices[this_index].length == 0) engagement_slices[this_index].push(0)
          if (agreement_slices[this_index].length == 0) agreement_slices[this_index].push(0)
      }

      if (agreement_slice_1.length == 0) agreement_slice_1.push(0)
      if (agreement_slice_2.length == 0) agreement_slice_2.push(0)
      if (agreement_slice_3.length == 0) agreement_slice_3.push(0)


      agreement_rate.push(agreement_slice_1.filter(i => i === 1).length / agreement_slice_1.length);
      agreement_rate.push(agreement_slice_2.filter(i => i === 1).length / agreement_slice_2.length);
      agreement_rate.push(agreement_slice_3.filter(i => i === 1).length / agreement_slice_3.length);

      engagement_slices["T1"] = engagement_slices['T1'].filter(i => i === 1).length / engagement_slices['T1'].length;
      engagement_slices["T2"] = engagement_slices['T2'].filter(i => i === 1).length / engagement_slices['T2'].length;
      engagement_slices["T3"] = engagement_slices['T3'].filter(i => i === 1).length / engagement_slices['T3'].length;
      engagement_slices["T4"] = engagement_slices['T4'].filter(i => i === 1).length / engagement_slices['T4'].length;
      engagement_slices["T5"] = engagement_slices['T5'].filter(i => i === 1).length / engagement_slices['T5'].length;
      engagement_slices["T6"] = engagement_slices['T6'].filter(i => i === 1).length / engagement_slices['T6'].length;
      engagement_slices["T7"] = engagement_slices['T7'].filter(i => i === 1).length / engagement_slices['T7'].length;
      engagement_slices["T8"] = engagement_slices['T8'].filter(i => i === 1).length / engagement_slices['T8'].length;
      engagement_slices["T9"] = engagement_slices['T9'].filter(i => i === 1).length / engagement_slices['T9'].length;
      engagement_slices["T10"] = engagement_slices['T10'].filter(i => i === 1).length / engagement_slices['T10'].length;
      engagement_slices["T11"] = engagement_slices['T11'].filter(i => i === 1).length / engagement_slices['T11'].length;
      engagement_slices["T12"] = engagement_slices['T12'].filter(i => i === 1).length / engagement_slices['T12'].length;

      engagement_slice_1 = (engagement_slices["T1"] + engagement_slices["T2"] + engagement_slices["T3"]+ engagement_slices["T4"])/4;
      engagement_slice_2 = (engagement_slices["T5"] + engagement_slices["T6"] + engagement_slices["T7"]+ engagement_slices["T8"])/4;
      engagement_slice_3 = (engagement_slices["T9"] + engagement_slices["T10"] + engagement_slices["T11"]+ engagement_slices["T12"])/4;
      
      reliance_rate.push((engagement_slice_1* (agreement_slice_1.filter(i => i === 1).length - agreement_slice_1.filter(i => i === -1).length)) / agreement_slice_1.length);
      reliance_rate.push((engagement_slice_2* (agreement_slice_2.filter(i => i === 1).length - agreement_slice_2.filter(i => i === -1).length)) / agreement_slice_2.length);
      reliance_rate.push((engagement_slice_3* (agreement_slice_3.filter(i => i === 1).length - agreement_slice_3.filter(i => i === -1).length)) / agreement_slice_3.length);

      measures.user_reliance = average(reliance_rate);
      // console.log('agreement_rate:  ', agreement_slice_1, agreement_slice_2, agreement_slice_3);
      // console.log(performance_slice_1,performance_slice_2,performance_slice_3)
      // console.log(slice_1.reduce((partial_sum, a) => partial_sum + a,0), slice_2.reduce((partial_sum, a) => partial_sum + a,0) , slice_3.reduce((partial_sum, a) => partial_sum + a,0) )
      // console.log(perceived_accuracy[0],perceived_accuracy[1],perceived_accuracy[2])

      // Type 1: down-down 
      // Type 2: down-up
      // Type 3: up-up
      // Type 4: up-down
      // Type 5: same-same
      const acc_threshold = 2;
      if ((perceived_accuracy[0] > perceived_accuracy[1]) & (perceived_accuracy[1] > perceived_accuracy[2])) {
        perc_acc_type = 1;
      } else if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) & ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold)) {
        perc_acc_type = 2;
      } else if ((perceived_accuracy[0] < perceived_accuracy[1]) & (perceived_accuracy[1] < perceived_accuracy[2])) {
        perc_acc_type = 3;
      } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) & ((perceived_accuracy[1] - perceived_accuracy[2]) > acc_threshold)) {
        perc_acc_type = 4;
      } else {
        // if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) || ((perceived_accuracy[1] - perceived_accuracy[2]) > 3) ) {
          if ( (perceived_accuracy[0] - perceived_accuracy[2]) > 2 * acc_threshold) {
           perc_acc_type = 1;
           // } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) || ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold) ) {
          } else if ( (perceived_accuracy[2] - perceived_accuracy[0]) > 2 * acc_threshold ) {
            perc_acc_type = 3;
          } else {
            perc_acc_type = 5;
            console.log('no change!: ', perceived_accuracy);
          }
      }

      measures.perceived_accuracy_avg = average(perceived_accuracy)
      perc_acc_change = (perceived_accuracy[2] - perceived_accuracy[0]) / 100.0;
      perc_acc_change_1 = (perceived_accuracy[1] - perceived_accuracy[0]) / 100.0;
      perc_acc_change_2 = (perceived_accuracy[2] - perceived_accuracy[1]) / 100.0;

      const agreement_threshold = 0.01;
      if ((agreement_rate[0] > agreement_rate[1]) & (agreement_rate[1] > agreement_rate[2])) {
        usr_agreement_type = 1;  // down-down
      } else if (((agreement_rate[0] - agreement_rate[1]) > agreement_threshold) & ((agreement_rate[2] - agreement_rate[1]) > agreement_threshold)) {
        usr_agreement_type = 2; 
      } else if ((agreement_rate[0] < agreement_rate[1]) & (agreement_rate[1] < agreement_rate[2])) {
        usr_agreement_type = 3;  // up-up
      } else if (((agreement_rate[1] - agreement_rate[0]) > agreement_threshold) & ((agreement_rate[1] - agreement_rate[2]) > agreement_threshold)) {
        usr_agreement_type = 4;
      } else {
          if ( (agreement_rate[0] - agreement_rate[2]) > 2 * agreement_threshold) {
           usr_agreement_type = 1;
          } else if ( (agreement_rate[2] - agreement_rate[0]) > 2 * agreement_threshold ) {
            usr_agreement_type = 3;
          } else {
            usr_agreement_type = 5;
            console.log('no change!: ', agreement_rate);
          }
      } 
      
      usr_agreement_change = agreement_rate[2] - agreement_rate[0];
      usr_agreement_change_1 = agreement_rate[1] - agreement_rate[0];
      usr_agreement_change_2 = agreement_rate[2] - agreement_rate[1];



      if ((reliance_rate[0] > reliance_rate[1]) & (reliance_rate[1] > reliance_rate[2])) {
        usr_reliance_type = 1;  // down-down
      } else if (((reliance_rate[0] - reliance_rate[1]) > agreement_threshold) & ((reliance_rate[2] - reliance_rate[1]) > agreement_threshold)) {
        usr_reliance_type = 2; 
      } else if ((reliance_rate[0] < reliance_rate[1]) & (reliance_rate[1] < reliance_rate[2])) {
        usr_reliance_type = 3;  // up-up
      } else if (((reliance_rate[1] - reliance_rate[0]) > agreement_threshold) & ((reliance_rate[1] - reliance_rate[2]) > agreement_threshold)) {
        usr_reliance_type = 4;
      } else {
          if ( (reliance_rate[0] - reliance_rate[2]) > 2 * agreement_threshold) {
           usr_reliance_type = 1;
          } else if ( (reliance_rate[2] - reliance_rate[0]) > 2 * agreement_threshold ) {
            usr_reliance_type = 3;
          } else {
            usr_reliance_type = 5;
            console.log('no change!: ', reliance_rate);
          }
      } 

      usr_reliance_change  = reliance_rate[2] - reliance_rate[0];
      usr_reliance_change_1 = reliance_rate[1] - reliance_rate[0];
      usr_reliance_change_2 = reliance_rate[2] - reliance_rate[1];
          
      // ---- check all agreement_slices['T1'].length ----

      const performance_threshold = 0.01;
      if ((performance_rate[0] > performance_rate[1]) & (performance_rate[1] > performance_rate[2])) {
        performance_type = 1;
      } else if (((performance_rate[0] - performance_rate[1]) > performance_threshold) & ((performance_rate[2] - performance_rate[1]) > agreement_threshold)) {
        performance_type = 2;
      } else if ((performance_rate[0] < performance_rate[1]) & (performance_rate[1] < performance_rate[2])) {
        performance_type = 3;
      } else if (((performance_rate[1] - performance_rate[0]) > performance_threshold) & ((performance_rate[1] - performance_rate[2]) > agreement_threshold)) {
        performance_type = 4;
      } else {
          if ( (performance_rate[0] - performance_rate[2]) > 2 * performance_threshold) {
           performance_type = 1;
          } else if ( (performance_rate[2] - performance_rate[0]) > 2 * performance_threshold ) {
            performance_type = 3;
          } else {
            performance_type = 5;
            console.log('no change!: ', performance_rate);
          }
      } 
      performance_change = performance_rate[2] - performance_rate[0];
      

      if ((report_rate[0] > report_rate[1]) & (report_rate[1] > report_rate[2])) {
        report_type = 1;
      } else if (((report_rate[0] - report_rate[1]) > performance_threshold) & ((report_rate[2] - report_rate[1]) > agreement_threshold)) {
        report_type = 2;
      } else if ((report_rate[0] < report_rate[1]) & (report_rate[1] < report_rate[2])) {
        report_type = 3;
      } else if (((report_rate[1] - report_rate[0]) > performance_threshold) & ((report_rate[1] - report_rate[2]) > agreement_threshold)) {
        report_type = 4;
      } else {
          if ( (report_rate[0] - report_rate[2]) > 2 * performance_threshold) {
           report_type = 1;
          } else if ( (report_rate[2] - report_rate[0]) > 2 * performance_threshold ) {
            report_type = 3;
          } else {
            report_type = 5;
            console.log('no change!: ', report_rate);
          }
      } 
      report_change = report_rate[2] - report_rate[0];
      


      if ((accuracy_rate[0] > accuracy_rate[1]) & (accuracy_rate[1] > accuracy_rate[2])) {
        accuracy_type = 1;
      } else if (((accuracy_rate[0] - accuracy_rate[1]) > performance_threshold) & ((accuracy_rate[2] - accuracy_rate[1]) > performance_threshold)) {
        accuracy_type = 2;
      } else if ((accuracy_rate[0] < accuracy_rate[1]) & (accuracy_rate[1] < accuracy_rate[2])) {
        accuracy_type = 3;
      } else if (((accuracy_rate[1] - accuracy_rate[0]) > performance_threshold) & ((accuracy_rate[1] - accuracy_rate[2]) > performance_threshold)) {
        accuracy_type = 4;
      } else {
          if ( (accuracy_rate[0] - accuracy_rate[2]) > 2 * performance_threshold) {
           accuracy_type = 1;
          } else if ( (accuracy_rate[2] - accuracy_rate[0]) > 2 * performance_threshold ) {
            accuracy_type = 3;
          } else {
            accuracy_type = 5;
            console.log('no change!: ', accuracy_rate);
          }
      } 
      accuracy_change = accuracy_rate[2] - accuracy_rate[0];
      avg_accuracy = (accuracy_rate[0] + accuracy_rate[1] + accuracy_rate[2]) /3;
      
      // if (usr_agreement_type == perc_acc_type) count_cor++;
      // console.log('count_cor', count_cor)  //

      // console.log(performance_type, performance_rate[2],performance_rate[1], performance_rate[0])
      // console.log(report_type, report_rate[2],report_rate[1], report_rate[0])
      reliance_slices['T1'] = (engagement_slices['T1']*(agreement_slices['T1'].filter(i => i === 1).length - agreement_slices['T1'].filter(i => i === -1).length)) / agreement_slices['T1'].length;
      reliance_slices['T2'] = (engagement_slices['T2']*(agreement_slices['T2'].filter(i => i === 1).length - agreement_slices['T2'].filter(i => i === -1).length)) / agreement_slices['T2'].length;
      reliance_slices['T3'] = (engagement_slices['T3']*(agreement_slices['T3'].filter(i => i === 1).length - agreement_slices['T3'].filter(i => i === -1).length)) / agreement_slices['T3'].length;
      reliance_slices['T4'] = (engagement_slices['T4']*(agreement_slices['T4'].filter(i => i === 1).length - agreement_slices['T4'].filter(i => i === -1).length)) / agreement_slices['T4'].length;
      reliance_slices['T5'] = (engagement_slices['T5']*(agreement_slices['T5'].filter(i => i === 1).length - agreement_slices['T5'].filter(i => i === -1).length)) / agreement_slices['T5'].length;
      reliance_slices['T6'] = (engagement_slices['T6']*(agreement_slices['T6'].filter(i => i === 1).length - agreement_slices['T6'].filter(i => i === -1).length)) / agreement_slices['T6'].length;
      reliance_slices['T7'] = (engagement_slices['T7']*(agreement_slices['T7'].filter(i => i === 1).length - agreement_slices['T7'].filter(i => i === -1).length)) / agreement_slices['T7'].length;
      reliance_slices['T8'] = (engagement_slices['T8']*(agreement_slices['T8'].filter(i => i === 1).length - agreement_slices['T8'].filter(i => i === -1).length)) / agreement_slices['T8'].length;
      reliance_slices['T9'] = (engagement_slices['T9']*(agreement_slices['T9'].filter(i => i === 1).length - agreement_slices['T9'].filter(i => i === -1).length)) / agreement_slices['T9'].length;
      reliance_slices['T10'] = (engagement_slices['T10']*(agreement_slices['T10'].filter(i => i === 1).length - agreement_slices['T10'].filter(i => i === -1).length)) / agreement_slices['T10'].length;
      reliance_slices['T11'] = (engagement_slices['T11']*(agreement_slices['T11'].filter(i => i === 1).length - agreement_slices['T11'].filter(i => i === -1).length)) / agreement_slices['T11'].length;
      reliance_slices['T12'] = (engagement_slices['T12']*(agreement_slices['T12'].filter(i => i === 1).length - agreement_slices['T12'].filter(i => i === -1).length)) / agreement_slices['T12'].length;


      csvString += taskRun.participant_id + ","
          + taskRun.condition_order[taskRun.current_condition] + ","
          // + measures.prediction_inspectin.toString().slice(0,4) + ","
          // + measures.user_prediction.toString().slice(0,4)+ ","
          + measures.perceived_accuracy.toString().slice(0,4) + ","
          + perc_acc_type + ","
          + perc_acc_change + ","
          + perc_acc_change_1 + ","
          + perc_acc_change_2 + ","
          + perceived_accuracy[0] + ","+ perceived_accuracy[1] + ","+ perceived_accuracy[2] + ","
          + measures.user_agreement.toString().slice(0,4) + ","
          + usr_agreement_type + ","
          + usr_agreement_change.toString().slice(0,5) + ","
          + usr_agreement_change_1.toString().slice(0,5) + ","
          + usr_agreement_change_2.toString().slice(0,5) + ","
          + agreement_rate[0].toString().slice(0,4) + "," + agreement_rate[1].toString().slice(0,4) + "," + agreement_rate[2].toString().slice(0,4) + ","
          + (agreement_slices['T1'].filter(i => i === 1).length / agreement_slices['T1'].length).toString().slice(0,4) + ","
          + (agreement_slices['T2'].filter(i => i === 1).length / agreement_slices['T2'].length).toString().slice(0,4) + ","
          + (agreement_slices['T3'].filter(i => i === 1).length / agreement_slices['T3'].length).toString().slice(0,4) + ","
          + (agreement_slices['T4'].filter(i => i === 1).length / agreement_slices['T4'].length).toString().slice(0,4) + ","
          + (agreement_slices['T5'].filter(i => i === 1).length / agreement_slices['T5'].length).toString().slice(0,4) + ","
          + (agreement_slices['T6'].filter(i => i === 1).length / agreement_slices['T6'].length).toString().slice(0,4) + ","
          + (agreement_slices['T7'].filter(i => i === 1).length / agreement_slices['T7'].length).toString().slice(0,4) + ","
          + (agreement_slices['T8'].filter(i => i === 1).length / agreement_slices['T8'].length).toString().slice(0,4) + ","
          + (agreement_slices['T9'].filter(i => i === 1).length / agreement_slices['T9'].length).toString().slice(0,4) + ","
          + (agreement_slices['T10'].filter(i => i === 1).length / agreement_slices['T10'].length).toString().slice(0,4) + ","
          + (agreement_slices['T11'].filter(i => i === 1).length / agreement_slices['T11'].length).toString().slice(0,4) + ","
          + (agreement_slices['T12'].filter(i => i === 1).length / agreement_slices['T12'].length).toString().slice(0,4) + ","
          + measures.user_reliance.toString().slice(0,5) + ","
          + usr_reliance_type + ","
          + usr_reliance_change.toString().slice(0,5) + ","
          + usr_reliance_change_1.toString().slice(0,5) + ","
          + usr_reliance_change_2.toString().slice(0,5) + ","
          + reliance_rate[0].toString().slice(0,4) + "," + reliance_rate[1].toString().slice(0,4) + "," + reliance_rate[2].toString().slice(0,4) + ","
          + reliance_slices['T1'].toString().slice(0,4) + ","
          + reliance_slices['T2'].toString().slice(0,4) + ","
          + reliance_slices['T3'].toString().slice(0,4) + ","
          + reliance_slices['T4'].toString().slice(0,4) + ","
          + reliance_slices['T5'].toString().slice(0,4) + ","
          + reliance_slices['T6'].toString().slice(0,4) + ","
          + reliance_slices['T7'].toString().slice(0,4) + ","
          + reliance_slices['T8'].toString().slice(0,4) + ","
          + reliance_slices['T9'].toString().slice(0,4) + ","
          + reliance_slices['T10'].toString().slice(0,4) + ","
          + reliance_slices['T11'].toString().slice(0,4) + ","
          + reliance_slices['T12'].toString().slice(0,4) + ","          
          + Math.abs(reliance_slices['T1'] -  reliance_slices['T2']).toString().slice(0,4) + ","
          + Math.abs(reliance_slices['T2'] -  reliance_slices['T3']).toString().slice(0,4) + ","
          + Math.abs(reliance_slices['T3'] -  reliance_slices['T4']).toString().slice(0,4) + ","
          + Math.abs(reliance_slices['T4'] -  reliance_slices['T5']).toString().slice(0,4) + ","
          + Math.abs(reliance_slices['T5'] -  reliance_slices['T6']).toString().slice(0,4) + ","
          + Math.abs(reliance_slices['T6'] -  reliance_slices['T7']).toString().slice(0,4) + ","
          + Math.abs(reliance_slices['T7'] -  reliance_slices['T8']).toString().slice(0,4) + ","
          + Math.abs(reliance_slices['T8'] -  reliance_slices['T9']).toString().slice(0,4) + ","
          + Math.abs(reliance_slices['T9'] -  reliance_slices['T10']).toString().slice(0,4) + ","
          + Math.abs(reliance_slices['T10'] -  reliance_slices['T11']).toString().slice(0,4) + ","
          + Math.abs(reliance_slices['T11'] -  reliance_slices['T12']).toString().slice(0,4)          
          + "<br/>"
  }

  res.send(csvString)
}



// ---  user trust and performance over time --> 3 and 12-points user reliance measures
logging.EngagementAnalysisTime = async (req, res) => {

  // const participantId = req.params.participantId

  var participantId = req.params.participantId
  var participantObjs = participantId.split(',');
  let count_cor = 0;
  let precision_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};
      // let recall_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};

  let csvString = "ID, condition, " + 
                  "user engagement_1," + 
                  "user engagement_2," + 
                  // "engagement type, engagement over time, T1, T2,T3,"+
                  "T1, T2,T3,T4,T5,T6,T7,T8,T9,T10,T11,T12" + 
                  " <br/>"


  for(let participant of participantObjs) {

      participantId = participant; 
      
      console.log('analysis done: ', participantId)


      let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
      let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()
      let taskRun;

      let all_surveys = ['mid_survey_1', 'mid_survey_2', 'end_survey_1', 'end_survey_2', 'survey_preStudy', 'post_study_survey']
      let response_forms = ['strategy', 'reasoning',  'limitation', 'additional']

      let average = (array) => array.reduce((a, b) => a + b) / array.length;

      var measures = {};
      let ai_claim_pred = 0       // show-claimPrediction
      let attr_exp_models = 0     // show-claimConfidences
      let attr_exp_article = 0    // show-explanation
      let attn_exp_claim = 0      // show-claimWords
      let attn_exp_article = 0    // show-articleWords
      let top3_exp_article = 0    // show-articleTopSentences

      let true_seen =0
      let fake_seen =0 
      let true_prediction =0
      let false_prediction =0 
      let true_shared = 0
      let fake_shared = 0
      let true_reported = 0
      let fake_reported = 0
      let true_guess = 0 
      let false_guess = 0

      let user_agreement = 0
      let user_disagreement = 0
      let user_agreement_exp = 0
      let user_disagreement_exp = 0
      let story_skipped = 0
      let story_selected = 0
      let story_reported = 0
      let article_selected = 0
      let article_inspected = 0
      let perceived_accuracy = [];
      

      measures.task_done = 0
      measures.user_engmnt = 0
      measures.user_response = 0
      measures.perceived_accuracy = 0

      let report_slice_1 = [];
      let report_slice_2 = [];
      let report_slice_3 = [];
      let report_rate = [];

      let performance_slice_1 = [];
      let performance_slice_2 = [];
      let performance_slice_3 = [];
      let performance_rate = [];
    
      let accuracy_rate = [];      

      let agreement_type = [];
      let agreement_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};
      let agreement_slice_1 = [];
      let agreement_slice_2 = [];
      let agreement_slice_3 = [];
      let agreement_rate = [];


      let reliance_type = [];
      let reliance_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};
      let reliance_slice_1 = [];
      let reliance_slice_2 = [];
      let reliance_slice_3 = [];
      let reliance_rate = [];
      
      let perc_acc_type = 0 
      let perc_acc_change = 0
      let conf_mat_slice_1 = [];
      let conf_mat_slice_2 = [];
      let conf_mat_slice_3 = [];

      let engagement_slices  = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};
      let engagement_rate = [];

      let study_start_time = 0         // done
      let study_end_time = 0           // left -- 
      total_survey_time = 0
      total_article_time = 0
      last_time_stamp = 0;
      total_idle = 0;
      exp_checked = [];
      ai_checked = [];

      for(let interaction of interactionsForParticipant) {
          
          if (study_start_time == 0 && (interaction.action == 'study_start'  || interaction.action == 'showQuestions')){
              taskRun = interaction.taskRun       // task-run to get the user id, condtions, etc. 
              for(let detailName in interaction.details) {
                if (detailName == 'timestamp') {
                  study_start_time = interaction.details[detailName]
                  last_time_stamp = study_start_time;
                }
              }
          }

          // non-survey actions
          if (all_surveys.includes(interaction.action) == false){

            if (interaction.action != 'showTopic') measures.user_engmnt++;

            // ----- skip a story  -----
            if (interaction.action == 'skippedStory') {
              if (interaction.details['credibility'].includes('true')) true_seen++;
              else fake_seen++;

              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              }else{
                false_prediction++;
              }

              story_skipped++;
            } 
            // ----- End skip story  -----

            // ----- select a story  -----
            if (interaction.action == 'selectedStory') {
              // console.log("Select T"+(story_selected+1))
              // console.log(agreement_slices["T"+(story_selected+1)])
              //  TP: share a true news
              //  FP: share a fake news
              //  TN: report a fake news
              //  FN: report a true news 

              if (interaction.details['credibility'].includes('true')) {
                true_shared++;
                true_seen++;
                  
                  if (story_selected < 12){
                    precision_slices["T"+(story_selected+1)].push('TP');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('TP');
                  }

                if (story_selected < 4){
                  performance_slice_1.push('TP');
                }else if (story_selected < 8){
                  performance_slice_2.push('TP');
                }else{
                  performance_slice_3.push('TP');
                }

                
              } else {
                fake_shared++;
                fake_seen++;

                if (story_selected < 12){
                  precision_slices["T"+(story_selected+1)].push('FP');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('FP');
                  }

                if (story_selected < 4){
                  performance_slice_1.push('FP');
                }else if (story_selected < 8){
                  performance_slice_2.push('FP');
                }else{
                  performance_slice_3.push('FP');
                }

              }

              
              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {
                if (interaction.details['prediction'] == 'True') {
                  user_agreement++;
                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(1);
                  engagement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }

                  agreement_type.push(1);  // -1: disagreement
                  if (story_selected < 4){
                    agreement_slice_1.push(1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(1);  // 1: agreement
                  }

                }
                if ((interaction.details['prediction'] == 'Fake') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement

                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(-1);
                  engagement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(-1);
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }

                  if (story_selected < 4){
                    agreement_slice_1.push(-1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(-1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(-1);  // 1: agreement
                  }
                }


                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }

              }else{   // -- did not checked AI --

                if (story_selected < 12){
                  engagement_slices["T"+(story_selected+1)].push(0);
                  }else{
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(0);
                  }

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }
              }


              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ){ 
                true_prediction++;
              }else{
                false_prediction++;
              }

            // console.log(story_selected)
            story_selected++; 
            }
            // ----- End select a story  -----


            // ----- report a story  -----
            if (interaction.action == 'reportStory') {
              story_reported++;
              if (interaction.details['credibility'].includes('true')) {
                  true_reported++;    
                  true_seen++;

                if (story_selected < 12){
                  precision_slices["T"+(story_selected+1)].push('FN');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('FN');
                }

                if (story_selected < 4){
                  report_slice_1.push('FN');
                }else if (story_selected < 8){
                  report_slice_2.push('FN');
                }else{
                  report_slice_3.push('FN');
                }

              } else {    
                 fake_reported++;    
                 fake_seen++;    

                 if (story_selected < 12){
                  precision_slices["T"+(story_selected+1)].push('TN');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('TN');
                }

                if (story_selected < 4){
                  report_slice_1.push('TN');
                }else if (story_selected < 8){
                  report_slice_2.push('TN');
                }else{
                  report_slice_3.push('TN');
                }
              }   

              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {
                if (interaction.details['prediction'] == 'Fake') {
                  user_agreement++;
                  agreement_type.push(1);  // 1: agreement
                  
                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(1);
                  engagement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }

                  if (story_selected < 4){
                    agreement_slice_1.push(1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(1);  // 1: agreement
                  }
                }
                if ((interaction.details['prediction'] == 'True') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement
                  

                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(-1);
                  engagement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(-1);
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }


                  if (story_selected < 4){
                    agreement_slice_1.push(-1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(-1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(-1);  // 1: agreement
                  }

                }

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }

              }else{   // did not checked AI

                if (story_selected < 12){
                    engagement_slices["T"+(story_selected+1)].push(0);
                  }else{
                    engagement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(0);
                  }

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }
              }


              // if ((interaction.details['prediction'] == 'Fake') && ai_checked.includes(interaction.details['claim_id']) ) user_agreement++;
              // if ((interaction.details['prediction'] == 'True') && ai_checked.includes(interaction.details['claim_id']) ) user_disagreement++;

              // if ((interaction.details['prediction'] == 'Fake') && exp_checked.includes(interaction.details['claim_id']) ) user_agreement_exp++;
              // if ((interaction.details['prediction'] == 'True') && exp_checked.includes(interaction.details['claim_id']) ) user_disagreement_exp++;

           
              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              } else {
                false_prediction++;
              }

            }
            // ----- End report a story  -----

            // ----- Other than skip, share, and report: -----

            if (interaction.action == 'showArticle') article_inspected++;
            if (interaction.action == 'chooseArticle') article_selected++;
            
            if ((interaction.action == 'show-claimPrediction') && !ai_checked.includes(interaction.details['topic'])) {
              ai_claim_pred++; 
              ai_checked.push(interaction.details['topic'])
            }

            //  attn
            if ((interaction.action == 'show-claimWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_claim++;
              exp_checked.push(interaction.details['topic']);
            }
            if ((interaction.action == 'show-articleWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_article++;
              exp_checked.push(interaction.details['topic']);
            };

            //  attr
            if ((interaction.action == 'show-claimConfidences')  && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_models++;
              exp_checked.push(interaction.details['topic'])
            } 
            if ((interaction.action == 'show-explanation')   && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }
            if ((interaction.action == 'show-articleTopSentences')   && !exp_checked.includes(interaction.details['topic'])) {
              top3_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }

            true_list = ['true', 'true?','ture','tru']
            false_list = ['false','fake', 'fake?','false?']  

            if ((interaction.details['credibility']) && (interaction.action == 'userGuess')) {
              user_guess = interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase()  // .replace(/ /g, '').replace(/True?orFake?/g, '').toLowerCase()  //True? or Fake?
              if (true_list.includes(user_guess) && interaction.details['credibility'].includes('true')) true_guess++;
              else if (false_list.includes(user_guess) && interaction.details['credibility'].includes('false')) true_guess++;
              else if (!true_list.includes(user_guess) && !false_list.includes(user_guess)) console.log('new user guess comment:>>', interaction.details['guess'],'<<') // '-->>',interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase(),"<<");
              else false_guess++;
            } 

              
            
            study_end_time = interaction.details['timestamp']
            if ((study_end_time - last_time_stamp) / 60 > 3){          // --  3 minutes threshold idle 
              total_idle += study_end_time - last_time_stamp;
            }
            last_time_stamp = study_end_time;
          
          // ---- surveys actions  ---- 
          }else{

            // 'mid_survey_1', 'mid_survey_2', 'end_survey_1'
            for(let detailName in interaction.details) {
              if (detailName == 'mental_model_range' ) {
                  perceived_accuracy.push(parseInt(interaction.details[detailName]))
              }
            } 
            

            if (interaction.action == 'post_study_survey' || interaction.action == 'end_survey_2'){  
              measures.task_done = 'ture'

              for(let detailName in interaction.details) {
                if (response_forms.includes(detailName) )  {
                  measures.user_response += interaction.details[detailName].toString().split(" ").length;
                }

                if (detailName == 'mental_model_range' )  {
                    measures.perceived_accuracy = interaction.details[detailName] 
                }

              } 

            }
            for(let detailName in interaction.details) {
              if (detailName == 'timestamp') {
                study_end_time = interaction.details[detailName]
                total_survey_time += study_end_time - last_time_stamp;
                last_time_stamp = study_end_time
              }
            } 

          }
          // ---- End of surveys actions  ---- 
      }
      // ---- End of all interactions  ---- 

      // console.log('agreement_slices: ', agreement_slices)
      
      measures.claim_inspected = story_skipped + story_selected + story_reported; 
      measures.article_inspected = article_inspected / (story_reported + story_selected); 
      
      measures.prediction_inspectin = ai_claim_pred / (story_reported + story_selected); 

      // console.log(ai_claim_pred, '==', (story_skipped + story_selected + story_reported),  '=!', (user_agreement + user_disagreement + story_skipped))

      measures.claim_exp_inspectin = (attr_exp_models + attn_exp_claim)  / (story_reported + story_selected); 
      // measures.claim_exp_inspectin_slc = (attr_exp_models + attn_exp_claim) / (story_selected);
      // measures.claim_exp_inspectin_skp = (attr_exp_models + attn_exp_claim) / (story_skipped);
      measures.artilce_exp_inspectin = (attr_exp_article + attn_exp_article + top3_exp_article)  / (story_reported + story_selected);

      measures.user_shared_veracity = true_shared / (true_shared + fake_shared);
      // console.log(true_shared, fake_shared)
      measures.user_reported_veracity = fake_reported / (true_reported + fake_reported);

      measures.user_agreement = user_agreement / (user_agreement + user_disagreement); // (story_reported + story_selected); // (true_shared + fake_reported);
      measures.user_agreement_exp = user_agreement_exp / (user_agreement_exp + user_disagreement_exp); // (story_reported + story_selected); // (true_shared + fake_reported);

      // console.log(true_guess, false_guess, true_guess / (true_guess + false_guess))
      measures.user_prediction = true_guess / (true_guess + false_guess)    // user prediction task 
      
      measures.news_veracity = true_seen / (true_seen + fake_seen);                        // check news veracity for all
      measures.model_accuracy = true_prediction / (true_prediction + false_prediction);    // check model accuracy for all
      // measures.user_engmnt 
      measures.task_duration = (study_end_time - study_start_time) / 60 - (total_idle / 60);  // total_article_time
      measures.payment = (measures.task_duration / 60) * 10;
      measures.total_survey_time = total_survey_time / 60;
      measures.total_article_time = measures.task_duration - measures.total_survey_time;

      
      
      
      // --- Precision in Time --- 

      


      //  TP: share a true news
      //  FP: share a fake news
      result_TP = performance_slice_1.filter(i => i === "TP").length; 
      result_FP = performance_slice_1.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));
      result_TP = performance_slice_2.filter(i => i === "TP").length; 
      result_FP = performance_slice_2.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));
      result_TP = performance_slice_3.filter(i => i === "TP").length; 
      result_FP = performance_slice_3.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));    // <<-- Precision of shared true news

      // console.log('user_shared_veracity: ', performance_rate, measures.user_shared_veracity, performance_rate.reduce((partial_sum, a) => partial_sum + a,0)/3)
      // console.log(performance_slice_1,performance_slice_2,performance_slice_3)



      //  TN: report a fake news
      //  FN: report a true news 
      rate = 0;
      result_TN = report_slice_1.filter(i => i === "TN").length; 
      result_FN = report_slice_1.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {
        rate = result_TN/(result_TN+result_FN)
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }
      result_TN = report_slice_2.filter(i => i === "TN").length; 
      result_FN = report_slice_2.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {  
        rate = result_TN/(result_TN+result_FN)
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }
      result_TN = report_slice_3.filter(i => i === "TN").length; 
      result_FN = report_slice_3.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {
        rate = result_TN/(result_TN+result_FN)   // <<-- Precision of reported fake news
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }  
      // console.log('user_fake_reported: ', report_rate, measures.user_reported_veracity, report_rate.reduce((partial_sum, a) => partial_sum + a,0)/3)
      // console.log(report_slice_1,report_slice_2,report_slice_3)

      result_TN = report_slice_1.filter(i => i === "TN").length; 
      result_FN = report_slice_1.filter(i => i === "FN").length;
      result_TP = performance_slice_1.filter(i => i === "TP").length; 
      result_FP = performance_slice_1.filter(i => i === "FP").length;

      total_accuracy = (result_TP + result_TN)/(result_TP+result_TN+result_FP+result_FN);
      accuracy_rate.push(total_accuracy)

      result_TN = report_slice_2.filter(i => i === "TN").length; 
      result_FN = report_slice_2.filter(i => i === "FN").length;
      result_TP = performance_slice_2.filter(i => i === "TP").length; 
      result_FP = performance_slice_2.filter(i => i === "FP").length;

      total_accuracy = (result_TP + result_TN)/(result_TP+result_TN+result_FP+result_FN);
      accuracy_rate.push(total_accuracy)

      result_TN = report_slice_3.filter(i => i === "TN").length; 
      result_FN = report_slice_3.filter(i => i === "FN").length;
      result_TP = performance_slice_3.filter(i => i === "TP").length; 
      result_FP = performance_slice_3.filter(i => i === "FP").length;

      total_accuracy = (result_TP + result_TN)/(result_TP+result_TN+result_FP+result_FN);
      accuracy_rate.push(total_accuracy)

      for (i=0;i<12;i++){ 
          this_index = "T"+(i+1);
          if (engagement_slices[this_index].length == 0) engagement_slices[this_index].push(0)
          if (agreement_slices[this_index].length == 0) agreement_slices[this_index].push(0)
      }

      if (agreement_slice_1.length == 0) agreement_slice_1.push(0)
      if (agreement_slice_2.length == 0) agreement_slice_2.push(0)
      if (agreement_slice_3.length == 0) agreement_slice_3.push(0)


      agreement_rate.push(agreement_slice_1.filter(i => i === 1).length / agreement_slice_1.length);
      agreement_rate.push(agreement_slice_2.filter(i => i === 1).length / agreement_slice_2.length);
      agreement_rate.push(agreement_slice_3.filter(i => i === 1).length / agreement_slice_3.length);

      engagement_slices["T1"] = engagement_slices['T1'].filter(i => i === 1).length / engagement_slices['T1'].length;
      engagement_slices["T2"] = engagement_slices['T2'].filter(i => i === 1).length / engagement_slices['T2'].length;
      engagement_slices["T3"] = engagement_slices['T3'].filter(i => i === 1).length / engagement_slices['T3'].length;
      engagement_slices["T4"] = engagement_slices['T4'].filter(i => i === 1).length / engagement_slices['T4'].length;
      engagement_slices["T5"] = engagement_slices['T5'].filter(i => i === 1).length / engagement_slices['T5'].length;
      engagement_slices["T6"] = engagement_slices['T6'].filter(i => i === 1).length / engagement_slices['T6'].length;
      engagement_slices["T7"] = engagement_slices['T7'].filter(i => i === 1).length / engagement_slices['T7'].length;
      engagement_slices["T8"] = engagement_slices['T8'].filter(i => i === 1).length / engagement_slices['T8'].length;
      engagement_slices["T9"] = engagement_slices['T9'].filter(i => i === 1).length / engagement_slices['T9'].length;
      engagement_slices["T10"] = engagement_slices['T10'].filter(i => i === 1).length / engagement_slices['T10'].length;
      engagement_slices["T11"] = engagement_slices['T11'].filter(i => i === 1).length / engagement_slices['T11'].length;
      engagement_slices["T12"] = engagement_slices['T12'].filter(i => i === 1).length / engagement_slices['T12'].length;

      engagement_slice_1 = (engagement_slices["T1"] + engagement_slices["T2"] + engagement_slices["T3"]+ engagement_slices["T4"])/4;
      engagement_slice_2 = (engagement_slices["T5"] + engagement_slices["T6"] + engagement_slices["T7"]+ engagement_slices["T8"])/4;
      engagement_slice_3 = (engagement_slices["T9"] + engagement_slices["T10"] + engagement_slices["T11"]+ engagement_slices["T12"])/4;
      total_engagement = (engagement_slice_3 + engagement_slice_2 + engagement_slice_1) / 3; 
      reliance_rate.push((engagement_slice_1* (agreement_slice_1.filter(i => i === 1).length - agreement_slice_1.filter(i => i === -1).length)) / agreement_slice_1.length);
      reliance_rate.push((engagement_slice_2* (agreement_slice_2.filter(i => i === 1).length - agreement_slice_2.filter(i => i === -1).length)) / agreement_slice_2.length);
      reliance_rate.push((engagement_slice_3* (agreement_slice_3.filter(i => i === 1).length - agreement_slice_3.filter(i => i === -1).length)) / agreement_slice_3.length);

      measures.user_reliance = average(reliance_rate);
      // console.log('agreement_rate:  ', agreement_slice_1, agreement_slice_2, agreement_slice_3);
      // console.log(performance_slice_1,performance_slice_2,performance_slice_3)
      // console.log(slice_1.reduce((partial_sum, a) => partial_sum + a,0), slice_2.reduce((partial_sum, a) => partial_sum + a,0) , slice_3.reduce((partial_sum, a) => partial_sum + a,0) )
      // console.log(perceived_accuracy[0],perceived_accuracy[1],perceived_accuracy[2])

      // Type 1: down-down 
      // Type 2: down-up
      // Type 3: up-up
      // Type 4: up-down
      // Type 5: same-same
      const acc_threshold = 2;
      if ((perceived_accuracy[0] > perceived_accuracy[1]) & (perceived_accuracy[1] > perceived_accuracy[2])) {
        perc_acc_type = 1;
      } else if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) & ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold)) {
        perc_acc_type = 2;
      } else if ((perceived_accuracy[0] < perceived_accuracy[1]) & (perceived_accuracy[1] < perceived_accuracy[2])) {
        perc_acc_type = 3;
      } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) & ((perceived_accuracy[1] - perceived_accuracy[2]) > acc_threshold)) {
        perc_acc_type = 4;
      } else {
        // if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) || ((perceived_accuracy[1] - perceived_accuracy[2]) > 3) ) {
          if ( (perceived_accuracy[0] - perceived_accuracy[2]) > 2 * acc_threshold) {
           perc_acc_type = 1;
           // } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) || ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold) ) {
          } else if ( (perceived_accuracy[2] - perceived_accuracy[0]) > 2 * acc_threshold ) {
            perc_acc_type = 3;
          } else {
            perc_acc_type = 5;
            console.log('no change!: ', perceived_accuracy);
          }
      }

      measures.perceived_accuracy_avg = average(perceived_accuracy)
      perc_acc_change = (perceived_accuracy[2] - perceived_accuracy[0]) / 100.0;
      perc_acc_change_1 = (perceived_accuracy[1] - perceived_accuracy[0]) / 100.0;
      perc_acc_change_2 = (perceived_accuracy[2] - perceived_accuracy[1]) / 100.0;

      const agreement_threshold = 0.01;
      if ((agreement_rate[0] > agreement_rate[1]) & (agreement_rate[1] > agreement_rate[2])) {
        usr_agreement_type = 1;  // down-down
      } else if (((agreement_rate[0] - agreement_rate[1]) > agreement_threshold) & ((agreement_rate[2] - agreement_rate[1]) > agreement_threshold)) {
        usr_agreement_type = 2; 
      } else if ((agreement_rate[0] < agreement_rate[1]) & (agreement_rate[1] < agreement_rate[2])) {
        usr_agreement_type = 3;  // up-up
      } else if (((agreement_rate[1] - agreement_rate[0]) > agreement_threshold) & ((agreement_rate[1] - agreement_rate[2]) > agreement_threshold)) {
        usr_agreement_type = 4;
      } else {
          if ( (agreement_rate[0] - agreement_rate[2]) > 2 * agreement_threshold) {
           usr_agreement_type = 1;
          } else if ( (agreement_rate[2] - agreement_rate[0]) > 2 * agreement_threshold ) {
            usr_agreement_type = 3;
          } else {
            usr_agreement_type = 5;
            console.log('no change!: ', agreement_rate);
          }
      } 
      
      usr_agreement_change = agreement_rate[2] - agreement_rate[0];
      usr_agreement_change_1 = agreement_rate[1] - agreement_rate[0];
      usr_agreement_change_2 = agreement_rate[2] - agreement_rate[1];



      if ((reliance_rate[0] > reliance_rate[1]) & (reliance_rate[1] > reliance_rate[2])) {
        usr_reliance_type = 1;  // down-down
      } else if (((reliance_rate[0] - reliance_rate[1]) > agreement_threshold) & ((reliance_rate[2] - reliance_rate[1]) > agreement_threshold)) {
        usr_reliance_type = 2; 
      } else if ((reliance_rate[0] < reliance_rate[1]) & (reliance_rate[1] < reliance_rate[2])) {
        usr_reliance_type = 3;  // up-up
      } else if (((reliance_rate[1] - reliance_rate[0]) > agreement_threshold) & ((reliance_rate[1] - reliance_rate[2]) > agreement_threshold)) {
        usr_reliance_type = 4;
      } else {
          if ( (reliance_rate[0] - reliance_rate[2]) > 2 * agreement_threshold) {
           usr_reliance_type = 1;
          } else if ( (reliance_rate[2] - reliance_rate[0]) > 2 * agreement_threshold ) {
            usr_reliance_type = 3;
          } else {
            usr_reliance_type = 5;
            console.log('no change!: ', reliance_rate);
          }
      } 

      usr_reliance_change  = reliance_rate[2] - reliance_rate[0];
      usr_reliance_change_1 = reliance_rate[1] - reliance_rate[0];
      usr_reliance_change_2 = reliance_rate[2] - reliance_rate[1];
          
      // ---- check all agreement_slices['T1'].length ----

      const performance_threshold = 0.01;
      if ((performance_rate[0] > performance_rate[1]) & (performance_rate[1] > performance_rate[2])) {
        performance_type = 1;
      } else if (((performance_rate[0] - performance_rate[1]) > performance_threshold) & ((performance_rate[2] - performance_rate[1]) > agreement_threshold)) {
        performance_type = 2;
      } else if ((performance_rate[0] < performance_rate[1]) & (performance_rate[1] < performance_rate[2])) {
        performance_type = 3;
      } else if (((performance_rate[1] - performance_rate[0]) > performance_threshold) & ((performance_rate[1] - performance_rate[2]) > agreement_threshold)) {
        performance_type = 4;
      } else {
          if ( (performance_rate[0] - performance_rate[2]) > 2 * performance_threshold) {
           performance_type = 1;
          } else if ( (performance_rate[2] - performance_rate[0]) > 2 * performance_threshold ) {
            performance_type = 3;
          } else {
            performance_type = 5;
            console.log('no change!: ', performance_rate);
          }
      } 
      performance_change = performance_rate[2] - performance_rate[0];
      

      if ((report_rate[0] > report_rate[1]) & (report_rate[1] > report_rate[2])) {
        report_type = 1;
      } else if (((report_rate[0] - report_rate[1]) > performance_threshold) & ((report_rate[2] - report_rate[1]) > agreement_threshold)) {
        report_type = 2;
      } else if ((report_rate[0] < report_rate[1]) & (report_rate[1] < report_rate[2])) {
        report_type = 3;
      } else if (((report_rate[1] - report_rate[0]) > performance_threshold) & ((report_rate[1] - report_rate[2]) > agreement_threshold)) {
        report_type = 4;
      } else {
          if ( (report_rate[0] - report_rate[2]) > 2 * performance_threshold) {
           report_type = 1;
          } else if ( (report_rate[2] - report_rate[0]) > 2 * performance_threshold ) {
            report_type = 3;
          } else {
            report_type = 5;
            console.log('no change!: ', report_rate);
          }
      } 
      report_change = report_rate[2] - report_rate[0];
      


      if ((accuracy_rate[0] > accuracy_rate[1]) & (accuracy_rate[1] > accuracy_rate[2])) {
        accuracy_type = 1;
      } else if (((accuracy_rate[0] - accuracy_rate[1]) > performance_threshold) & ((accuracy_rate[2] - accuracy_rate[1]) > performance_threshold)) {
        accuracy_type = 2;
      } else if ((accuracy_rate[0] < accuracy_rate[1]) & (accuracy_rate[1] < accuracy_rate[2])) {
        accuracy_type = 3;
      } else if (((accuracy_rate[1] - accuracy_rate[0]) > performance_threshold) & ((accuracy_rate[1] - accuracy_rate[2]) > performance_threshold)) {
        accuracy_type = 4;
      } else {
          if ( (accuracy_rate[0] - accuracy_rate[2]) > 2 * performance_threshold) {
           accuracy_type = 1;
          } else if ( (accuracy_rate[2] - accuracy_rate[0]) > 2 * performance_threshold ) {
            accuracy_type = 3;
          } else {
            accuracy_type = 5;
            console.log('no change!: ', accuracy_rate);
          }
      } 
      accuracy_change = accuracy_rate[2] - accuracy_rate[0];
      avg_accuracy = (accuracy_rate[0] + accuracy_rate[1] + accuracy_rate[2]) /3;
      
      // if (usr_agreement_type == perc_acc_type) count_cor++;
      // console.log('count_cor', count_cor)  //

      // console.log(performance_type, performance_rate[2],performance_rate[1], performance_rate[0])
      // console.log(report_type, report_rate[2],report_rate[1], report_rate[0])

      csvString += taskRun.participant_id + ","
          + taskRun.condition_order[taskRun.current_condition] + ","
          + measures.prediction_inspectin.toString().slice(0,5) + ","
          + total_engagement.toString().slice(0,5) + ","
          // + usr_reliance_type + ","
          // + usr_reliance_change.toString().slice(0,5) + ","
          // + reliance_rate[0].toString().slice(0,4) + "," + reliance_rate[1].toString().slice(0,4) + "," + reliance_rate[2].toString().slice(0,4) + ","
          + engagement_slices['T1'].toString().slice(0,4) + ","
          + engagement_slices['T2'].toString().slice(0,4) + ","
          + engagement_slices['T3'].toString().slice(0,4) + ","
          + engagement_slices['T4'].toString().slice(0,4) + ","
          + engagement_slices['T5'].toString().slice(0,4) + ","
          + engagement_slices['T6'].toString().slice(0,4) + ","
          + engagement_slices['T7'].toString().slice(0,4) + ","
          + engagement_slices['T8'].toString().slice(0,4) + ","
          + engagement_slices['T9'].toString().slice(0,4) + ","
          + engagement_slices['T10'].toString().slice(0,4) + ","
          + engagement_slices['T11'].toString().slice(0,4) + ","
          + engagement_slices['T12'].toString().slice(0,4)
          + "<br/>"
  }

  res.send(csvString)
}




// ---  user trust and performance over time --> 3 and 12-points user reliance measures
logging.PerformAnalysisTime = async (req, res) => {



  var participantId = req.params.participantId
  var participantObjs = participantId.split(',');

  let PerformanceString = "ID, condition, " + 
                  "True News Percision," + 
                  "Fake News Percision, "+
                  "Accuracy Dynamic," + 
                  "Accuracy Change," + 
                  "Total Accuracy," + 
                  "Accuracy 1/3," + 
                  "Accuracy 2/3," + 
                  "Accuracy 3/3," + 
                  "T1, T2,T3,T4,T5,T6,T7,T8,T9,T10,T11,T12" +
                  " <br/>"



  // ------------- start a loof for all participants --------------    

  for(let participant of participantObjs) {

      participantId = participant; 
      
      console.log('analysis done: ', participantId)


      let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
      let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()
      let taskRun;

      let all_surveys = ['mid_survey_1', 'mid_survey_2', 'end_survey_1', 'end_survey_2', 'survey_preStudy', 'post_study_survey']
      let response_forms = ['strategy', 'reasoning',  'limitation', 'additional']

      let average = (array) => array.reduce((a, b) => a + b) / array.length;

      var measures = {};
      let ai_claim_pred = 0       // show-claimPrediction
      let attr_exp_models = 0     // show-claimConfidences
      let attr_exp_article = 0    // show-explanation
      let attn_exp_claim = 0      // show-claimWords
      let attn_exp_article = 0    // show-articleWords
      let top3_exp_article = 0    // show-articleTopSentences

      let true_seen =0
      let fake_seen =0 
      let true_prediction =0
      let false_prediction =0 
      let true_shared = 0
      let fake_shared = 0
      let true_reported = 0
      let fake_reported = 0
      let true_guess = 0 
      let false_guess = 0

      let user_agreement = 0
      let user_disagreement = 0
      let user_agreement_exp = 0
      let user_disagreement_exp = 0
      let story_skipped = 0
      let story_selected = 0
      let story_reported = 0
      let article_selected = 0
      let article_inspected = 0
      let perceived_accuracy = [];
      

      measures.task_done = 0
      measures.user_engmnt = 0
      measures.user_response = 0
      measures.perceived_accuracy = 0

      let report_slice_1 = [];
      let report_slice_2 = [];
      let report_slice_3 = [];
      let report_rate = [];

      let performance_slice_1 = [];
      let performance_slice_2 = [];
      let performance_slice_3 = [];
      let performance_rate = [];
      

      let agreement_type = [];
      let agreement_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};
      let agreement_slice_1 = [];
      let agreement_slice_2 = [];
      let agreement_slice_3 = [];
      let agreement_rate = [];

      let count_cor = 0;
      let precision_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};


      let error_ai = {"T1":0,"T2":0,"T3":0};
      let error_human = {"T1":0,"T2":0,"T3":0};
      let error_human_ai = {"T1":0,"T2":0,"T3":0}

      let perc_acc_type = 0 
      let perc_acc_change = 0
      let conf_mat_slice_1 = [];
      let conf_mat_slice_2 = [];
      let conf_mat_slice_3 = [];

      let study_start_time = 0         // done
      let study_end_time = 0           // left -- 
      total_survey_time = 0
      total_article_time = 0
      last_time_stamp = 0;
      total_idle = 0;
      exp_checked = [];
      ai_checked = [];

      for(let interaction of interactionsForParticipant) {
          
          if (study_start_time == 0 && (interaction.action == 'study_start'  || interaction.action == 'showQuestions')){
              taskRun = interaction.taskRun       // task-run to get the user id, condtions, etc. 
              for(let detailName in interaction.details) {
                if (detailName == 'timestamp') {
                  study_start_time = interaction.details[detailName]
                  last_time_stamp = study_start_time;
                }
              }
          }

          // non-survey actions
          if (all_surveys.includes(interaction.action) == false){

            if (interaction.action != 'showTopic') measures.user_engmnt++;

            // ----- skip a story  -----
            if (interaction.action == 'skippedStory') {
              if (interaction.details['credibility'].includes('true')) true_seen++;
              else fake_seen++;

              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              }else{
                false_prediction++;
              }

              story_skipped++;
            } 
            // ----- End skip story  -----

            // ----- select a story  -----
            if (interaction.action == 'selectedStory') {
              // console.log("Select T"+(story_selected+1))
              // console.log(agreement_slices["T"+(story_selected+1)])
              //  TP: share a true news
              //  FP: share a fake news
              //  TN: report a fake news
              //  FN: report a true news 



              // if (story_selected < 4) this_error = "T1";
              // else if (story_selected < 8) this_error = "T2";
              // else this_error = "T3";


              // if (interaction.details['credibility'].includes('true')) {
              //   if (interaction.details['prediction'] == 'False') error_ai[this_error]+=1
              // }else{
              //   if (interaction.details['prediction'] == 'True') error_human[this_error]+=1
              //   else error_human_ai[this_error]+=1
              // }

              if (interaction.details['credibility'].includes('true')) {
                true_shared++;
                true_seen++;
                  
                  if (story_selected < 12){
                    precision_slices["T"+(story_selected+1)].push('TP');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('TP');
                  }

                if (story_selected < 4){
                  performance_slice_1.push('TP');
                }else if (story_selected < 8){
                  performance_slice_2.push('TP');
                }else{
                  performance_slice_3.push('TP');
                }

              } else {
                fake_shared++;
                fake_seen++;

                if (story_selected < 12){
                  precision_slices["T"+(story_selected+1)].push('FP');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('FP');
                  }

                if (story_selected < 4){
                  performance_slice_1.push('FP');
                }else if (story_selected < 8){
                  performance_slice_2.push('FP');
                }else{
                  performance_slice_3.push('FP');
                }

              }

              
              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {

                // ------------------ 
                if (story_selected < 4) this_error = "T1";
                else if (story_selected < 8) this_error = "T2";
                else this_error = "T3";


                if (interaction.details['credibility'].includes('true')) {
                  if (interaction.details['prediction'] == 'False') error_ai[this_error]+=1
                }else{
                  if (interaction.details['prediction'] == 'True') error_human[this_error]+=1
                  else error_human_ai[this_error]+=1
                }
                // ------------------

                if (interaction.details['prediction'] == 'True') {
                  user_agreement++;
                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }

                  agreement_type.push(1);  // -1: disagreement
                  if (story_selected < 4){
                    agreement_slice_1.push(1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(1);  // 1: agreement
                  }

                }
                if ((interaction.details['prediction'] == 'Fake') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement

                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(-1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(-1);
                  }

                  if (story_selected < 4){
                    agreement_slice_1.push(-1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(-1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(-1);  // 1: agreement
                  }
                }


                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }

              }else{   // -- did not checked AI --

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }
              }


              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ){ 
                true_prediction++;
              }else{
                false_prediction++;
              }

            // console.log(story_selected)
            story_selected++; 
            }
            // ----- End select a story  -----


            // ----- report a story  -----
            if (interaction.action == 'reportStory') {
              story_reported++;

              // if (story_selected < 4) this_error = "T1"
              // else if (story_selected < 8) this_error = "T2"
              // else this_error = "T3"

              // if (interaction.details['credibility'].includes('true')) {
              //   if (interaction.details['prediction'] == 'True') error_human_ai[this_error]+=1
              //   else error_human[this_error]+=1
              // }else{
              //   if (interaction.details['prediction'] == 'True') error_ai[this_error]+=1
              // }


              if (interaction.details['credibility'].includes('true')) {
                  true_reported++;    
                  true_seen++;

                if (story_selected < 12){
                  precision_slices["T"+(story_selected+1)].push('FN');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('FN');
                }

                if (story_selected < 4){
                  report_slice_1.push('FN');
                }else if (story_selected < 8){
                  report_slice_2.push('FN');
                }else{
                  report_slice_3.push('FN');
                }

              } else {    
                 fake_reported++;    
                 fake_seen++;    

                 if (story_selected < 12){
                    precision_slices["T"+(story_selected+1)].push('TN');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('TN');
                }

                if (story_selected < 4){
                  report_slice_1.push('TN');
                }else if (story_selected < 8){
                  report_slice_2.push('TN');
                }else{
                  report_slice_3.push('TN');
                }
              }   

              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {

                // -----------
                if (story_selected < 4) this_error = "T1"
                else if (story_selected < 8) this_error = "T2"
                else this_error = "T3"

                if (interaction.details['credibility'].includes('true')) {
                  if (interaction.details['prediction'] == 'True') error_human_ai[this_error]+=1
                  else error_human[this_error]+=1
                }else{
                  if (interaction.details['prediction'] == 'True') error_ai[this_error]+=1
                }
                // -----------
                
                if (interaction.details['prediction'] == 'Fake') {
                  user_agreement++;
                  agreement_type.push(1);  // 1: agreement
                  
                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }

                  if (story_selected < 4){
                    agreement_slice_1.push(1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(1);  // 1: agreement
                  }
                }
                if ((interaction.details['prediction'] == 'True') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement
                  

                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(-1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(-1);
                  }


                  if (story_selected < 4){
                    agreement_slice_1.push(-1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(-1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(-1);  // 1: agreement
                  }
                }

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }

              }else{   // did not checked AI

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }
              }


              // if ((interaction.details['prediction'] == 'Fake') && ai_checked.includes(interaction.details['claim_id']) ) user_agreement++;
              // if ((interaction.details['prediction'] == 'True') && ai_checked.includes(interaction.details['claim_id']) ) user_disagreement++;

              // if ((interaction.details['prediction'] == 'Fake') && exp_checked.includes(interaction.details['claim_id']) ) user_agreement_exp++;
              // if ((interaction.details['prediction'] == 'True') && exp_checked.includes(interaction.details['claim_id']) ) user_disagreement_exp++;

           
              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              } else {
                false_prediction++;
              }

            }
            // ----- End report a story  -----

            // ----- Other than skip, share, and report: -----

            if (interaction.action == 'showArticle') article_inspected++;
            if (interaction.action == 'chooseArticle') article_selected++;
            
            if ((interaction.action == 'show-claimPrediction') && !ai_checked.includes(interaction.details['topic'])) {
              ai_claim_pred++; 
              ai_checked.push(interaction.details['topic'])
            }

            //  attn
            if ((interaction.action == 'show-claimWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_claim++;
              exp_checked.push(interaction.details['topic']);
            }
            if ((interaction.action == 'show-articleWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_article++;
              exp_checked.push(interaction.details['topic']);
            };

            //  attr
            if ((interaction.action == 'show-claimConfidences')  && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_models++;
              exp_checked.push(interaction.details['topic'])
            } 
            if ((interaction.action == 'show-explanation')   && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }
            if ((interaction.action == 'show-articleTopSentences')   && !exp_checked.includes(interaction.details['topic'])) {
              top3_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }

            true_list = ['true', 'true?','ture','tru']
            false_list = ['false','fake', 'fake?','false?']  

            if ((interaction.details['credibility']) && (interaction.action == 'userGuess')) {
              user_guess = interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase()  // .replace(/ /g, '').replace(/True?orFake?/g, '').toLowerCase()  //True? or Fake?
              if (true_list.includes(user_guess) && interaction.details['credibility'].includes('true')) true_guess++;
              else if (false_list.includes(user_guess) && interaction.details['credibility'].includes('false')) true_guess++;
              else if (!true_list.includes(user_guess) && !false_list.includes(user_guess)) console.log('new user guess comment:>>', interaction.details['guess'],'<<') // '-->>',interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase(),"<<");
              else false_guess++;
            } 

              
            
            study_end_time = interaction.details['timestamp']
            if ((study_end_time - last_time_stamp) / 60 > 3){          // --  3 minutes threshold idle 
              total_idle += study_end_time - last_time_stamp;
            }
            last_time_stamp = study_end_time;
          
          // ---- surveys actions  ---- 
          }else{

            // 'mid_survey_1', 'mid_survey_2', 'end_survey_1'
            for(let detailName in interaction.details) {
              if (detailName == 'mental_model_range' ) {
                  perceived_accuracy.push(parseInt(interaction.details[detailName]))
              }
            } 
            

            if (interaction.action == 'post_study_survey' || interaction.action == 'end_survey_2'){  
              measures.task_done = 'ture'

              for(let detailName in interaction.details) {
                if (response_forms.includes(detailName) )  {
                  measures.user_response += interaction.details[detailName].toString().split(" ").length;
                }

                if (detailName == 'mental_model_range' )  {
                    measures.perceived_accuracy = interaction.details[detailName] 
                }

              } 

            }
            for(let detailName in interaction.details) {
              if (detailName == 'timestamp') {
                study_end_time = interaction.details[detailName]
                total_survey_time += study_end_time - last_time_stamp;
                last_time_stamp = study_end_time
              }
            } 

          }
          // ---- End of surveys actions  ---- 
      }
      // ---- End of all interactions  ---- 

      // console.log('agreement_slices: ', agreement_slices)
      
      measures.claim_inspected = story_skipped + story_selected + story_reported; 
      measures.article_inspected = article_inspected / (story_reported + story_selected); 
      
      measures.prediction_inspectin = ai_claim_pred / (story_reported + story_selected); 

      // console.log(ai_claim_pred, '==', (story_skipped + story_selected + story_reported),  '=!', (user_agreement + user_disagreement + story_skipped))

      measures.claim_exp_inspectin = (attr_exp_models + attn_exp_claim)  / (story_reported + story_selected); 
      // measures.claim_exp_inspectin_slc = (attr_exp_models + attn_exp_claim) / (story_selected);
      // measures.claim_exp_inspectin_skp = (attr_exp_models + attn_exp_claim) / (story_skipped);
      measures.artilce_exp_inspectin = (attr_exp_article + attn_exp_article + top3_exp_article)  / (story_reported + story_selected);

      measures.user_shared_veracity = true_shared / (true_shared + fake_shared);
      // console.log(true_shared, fake_shared)
      measures.user_reported_veracity = fake_reported / (true_reported + fake_reported);

      measures.user_agreement = user_agreement / (user_agreement + user_disagreement); // (story_reported + story_selected); // (true_shared + fake_reported);
      measures.user_agreement_exp = user_agreement_exp / (user_agreement_exp + user_disagreement_exp); // (story_reported + story_selected); // (true_shared + fake_reported);

      // console.log(true_guess, false_guess, true_guess / (true_guess + false_guess))
      measures.user_prediction = true_guess / (true_guess + false_guess)    // user prediction task 
      
      measures.news_veracity = true_seen / (true_seen + fake_seen);                        // check news veracity for all
      measures.model_accuracy = true_prediction / (true_prediction + false_prediction);    // check model accuracy for all
      // measures.user_engmnt 
      measures.task_duration = (study_end_time - study_start_time) / 60 - (total_idle / 60);  // total_article_time
      measures.payment = (measures.task_duration / 60) * 10;
      measures.total_survey_time = total_survey_time / 60;
      measures.total_article_time = measures.task_duration - measures.total_survey_time;

      measures.perceived_accuracy_avg = average(perceived_accuracy)
      perc_acc_change = perceived_accuracy[2] - perceived_accuracy[0];
      
      
      // --- Precision in Time --- 

      


      //  TP: share a true news
      //  FP: share a fake news
      result_TP = performance_slice_1.filter(i => i === "TP").length; 
      result_FP = performance_slice_1.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));
      result_TP = performance_slice_2.filter(i => i === "TP").length; 
      result_FP = performance_slice_2.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));
      result_TP = performance_slice_3.filter(i => i === "TP").length; 
      result_FP = performance_slice_3.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));    // <<-- Precision of shared true news

      // console.log('user_shared_veracity: ', performance_rate, measures.user_shared_veracity, performance_rate.reduce((partial_sum, a) => partial_sum + a,0)/3)
      // console.log(performance_slice_1,performance_slice_2,performance_slice_3)


      //  TN: report a fake news
      //  FN: report a true news 
      rate = 0;
      result_TN = report_slice_1.filter(i => i === "TN").length; 
      result_FN = report_slice_1.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {
        rate = result_TN/(result_TN+result_FN)
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }
      result_TN = report_slice_2.filter(i => i === "TN").length; 
      result_FN = report_slice_2.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {  
        rate = result_TN/(result_TN+result_FN)
        report_rate.push(rate);
      } else { 
        report_rate.push(rate)
      }
      result_TN = report_slice_3.filter(i => i === "TN").length; 
      result_FN = report_slice_3.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {
        rate = result_TN/(result_TN+result_FN)   // <<-- Precision of reported fake news
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }  
      // console.log('user_fake_reported: ', report_rate, measures.user_reported_veracity, report_rate.reduce((partial_sum, a) => partial_sum + a,0)/3)
      // console.log(report_slice_1,report_slice_2,report_slice_3)


      agreement_rate.push(agreement_slice_1.filter(i => i === 1).length / agreement_slice_1.length);
      agreement_rate.push(agreement_slice_2.filter(i => i === 1).length / agreement_slice_2.length);
      agreement_rate.push(agreement_slice_3.filter(i => i === 1).length / agreement_slice_3.length);

      // console.log('agreement_rate:  ', agreement_slice_1, agreement_slice_2, agreement_slice_3);
      // console.log(performance_slice_1,performance_slice_2,performance_slice_3)
      // console.log(slice_1.reduce((partial_sum, a) => partial_sum + a,0), slice_2.reduce((partial_sum, a) => partial_sum + a,0) , slice_3.reduce((partial_sum, a) => partial_sum + a,0) )
      // console.log(perceived_accuracy[0],perceived_accuracy[1],perceived_accuracy[2])

      // Type 1: down-down 
      // Type 2: down-up
      // Type 3: up-up
      // Type 4: up-down
      // Type 5: same-same

      const acc_threshold = 2;
      if ((perceived_accuracy[0] > perceived_accuracy[1]) & (perceived_accuracy[1] > perceived_accuracy[2])) {
        perc_acc_type = 1;
      } else if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) & ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold)) {
        perc_acc_type = 2;
      } else if ((perceived_accuracy[0] < perceived_accuracy[1]) & (perceived_accuracy[1] < perceived_accuracy[2])) {
        perc_acc_type = 3;
      } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) & ((perceived_accuracy[1] - perceived_accuracy[2]) > acc_threshold)) {
        perc_acc_type = 4;
      } else {
        // if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) || ((perceived_accuracy[1] - perceived_accuracy[2]) > 3) ) {
          if ( (perceived_accuracy[0] - perceived_accuracy[2]) > 2 * acc_threshold) {
           perc_acc_type = 1;
           // } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) || ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold) ) {
          } else if ( (perceived_accuracy[2] - perceived_accuracy[0]) > 2 * acc_threshold ) {
            perc_acc_type = 3;
          } else {
            perc_acc_type = 5;
            console.log('no change!: ', perceived_accuracy);
          }
      }


      const agreement_threshold = 0.01;
      if ((agreement_rate[0] > agreement_rate[1]) & (agreement_rate[1] > agreement_rate[2])) {
        usr_agreement_type = 1;
      } else if (((agreement_rate[0] - agreement_rate[1]) > agreement_threshold) & ((agreement_rate[2] - agreement_rate[1]) > agreement_threshold)) {
        usr_agreement_type = 2;
      } else if ((agreement_rate[0] < agreement_rate[1]) & (agreement_rate[1] < agreement_rate[2])) {
        usr_agreement_type = 3;
      } else if (((agreement_rate[1] - agreement_rate[0]) > agreement_threshold) & ((agreement_rate[1] - agreement_rate[2]) > agreement_threshold)) {
        usr_agreement_type = 4;
      } else {
          if ( (agreement_rate[0] - agreement_rate[2]) > 2 * agreement_threshold) {
           usr_agreement_type = 1;
          } else if ( (agreement_rate[2] - agreement_rate[0]) > 2 * agreement_threshold ) {
            usr_agreement_type = 3;
          } else {
            usr_agreement_type = 5;
            console.log('no change!: ', agreement_rate);
          }
      } 
      usr_agreement_change = agreement_rate[2] - agreement_rate[0];

      const performance_threshold = 0.01;
      if ((performance_rate[0] > performance_rate[1]) & (performance_rate[1] > performance_rate[2])) {
        performance_type = 1;
      } else if (((performance_rate[0] - performance_rate[1]) > performance_threshold) & ((performance_rate[2] - performance_rate[1]) > agreement_threshold)) {
        performance_type = 2;
      } else if ((performance_rate[0] < performance_rate[1]) & (performance_rate[1] < performance_rate[2])) {
        performance_type = 3;
      } else if (((performance_rate[1] - performance_rate[0]) > performance_threshold) & ((performance_rate[1] - performance_rate[2]) > agreement_threshold)) {
        performance_type = 4;
      } else {
          if ( (performance_rate[0] - performance_rate[2]) > 2 * performance_threshold) {
           performance_type = 1;
          } else if ( (performance_rate[2] - performance_rate[0]) > 2 * performance_threshold ) {
            performance_type = 3;
          } else {
            performance_type = 5;
            console.log('no change!: ', performance_rate);
          }
      } 
      performance_change = performance_rate[2] - performance_rate[0];
      

      if ((report_rate[0] > report_rate[1]) & (report_rate[1] > report_rate[2])) {
        report_type = 1;
      } else if (((report_rate[0] - report_rate[1]) > performance_threshold) & ((report_rate[2] - report_rate[1]) > agreement_threshold)) {
        report_type = 2;
      } else if ((report_rate[0] < report_rate[1]) & (report_rate[1] < report_rate[2])) {
        report_type = 3;
      } else if (((report_rate[1] - report_rate[0]) > performance_threshold) & ((report_rate[1] - report_rate[2]) > agreement_threshold)) {
        report_type = 4;
      } else {
          if ( (report_rate[0] - report_rate[2]) > 2 * performance_threshold) {
           report_type = 1;
          } else if ( (report_rate[2] - report_rate[0]) > 2 * performance_threshold ) {
            report_type = 3;
          } else {
            report_type = 5;
            console.log('no change!: ', report_rate);
          }
      } 
      report_change = report_rate[2] - report_rate[0];

    //  -- Calculate average performance for T1-T12 

  //  TP: share a true news .
  //  FP: share a fake news . 
  //  TN: report a fake news.
  //  FN: report a true news.
  let accuracy_slices = {"T1":0,"T2":0,"T3":0,"T4":0,"T5":0,"T6":0,"T7":0,"T8":0,"T9":0,"T10":0,"T11":0,"T12":0};
  total_TN = 0;
  total_TP = 0;
  total_FN = 0;
  total_FP = 0;

  
  for (i=0;i<12;i++){ 
    this_index = "T"+(i+1);
    result_TP = precision_slices[this_index].filter(i => i === "TP").length; 
    result_FP = precision_slices[this_index].filter(i => i === "FP").length;
    result_TN = precision_slices[this_index].filter(i => i === "TN").length; 
    result_FN = precision_slices[this_index].filter(i => i === "FN").length;

    accuracy_slices[this_index] = (result_TP + result_TN)/(result_TP+result_TN+result_FP+result_FN);  

    total_TN+=result_TN
    total_TP+=result_TP
    total_FN+=result_FN
    total_FP+=result_FP
  }


  // console.log('accuracy_slices: ', precision_slices)

    
    // --- New Total Accuracy
    accuracy_type = 0;
    accuracy_rate = [];
    accuracy_rate.push((accuracy_slices['T1']+accuracy_slices['T2']+accuracy_slices['T3']+accuracy_slices['T4'])/4)
    accuracy_rate.push((accuracy_slices['T5']+accuracy_slices['T6']+accuracy_slices['T7']+accuracy_slices['T8'])/4)
    accuracy_rate.push((accuracy_slices['T9']+accuracy_slices['T10']+accuracy_slices['T11']+accuracy_slices['T12'])/4)
    
    // performance_threshold = 0.01;
    if ((accuracy_rate[0] > accuracy_rate[1]) & (accuracy_rate[1] > accuracy_rate[2])) {
      accuracy_type = 1;
    } else if (((accuracy_rate[0] - accuracy_rate[1]) > performance_threshold) & ((accuracy_rate[2] - accuracy_rate[1]) > performance_threshold)) {
      accuracy_type = 2;
    } else if ((accuracy_rate[0] < accuracy_rate[1]) & (accuracy_rate[1] < accuracy_rate[2])) {
      accuracy_type = 3;
    } else if (((accuracy_rate[1] - accuracy_rate[0]) > performance_threshold) & ((accuracy_rate[1] - accuracy_rate[2]) > performance_threshold)) {
      accuracy_type = 4;
    } else {
        if ( (accuracy_rate[0] - accuracy_rate[2]) > 2 * performance_threshold) {
         accuracy_type = 1;
        } else if ( (accuracy_rate[2] - accuracy_rate[0]) > 2 * performance_threshold ) {
          accuracy_type = 3;
        } else {
          accuracy_type = 5;
          console.log('no change!: ', accuracy_rate);
        }
    } 
    accuracy_change = accuracy_rate[2] - accuracy_rate[0];
    avg_accuracy = (accuracy_rate[0] + accuracy_rate[1] + accuracy_rate[2]) /3;
    
  // console.log('accuracy_rate: ', accuracy_rate, accuracy_change, accuracy_type)
  // console.log("error_ai", error_ai)
  // console.log("error_human", error_human)
  // console.log("error_human_ai",error_human_ai)

  total_accuracy = (total_TP + total_TN)/(total_TP+total_TN+total_FP+total_FN);
  true_precision = total_TP/(total_TP+total_FP);
  fake_precision = total_TN/(total_TN+total_TP); 

  PerformanceString += 
          taskRun.participant_id + ","
          + taskRun.condition_order[taskRun.current_condition] + ","
          + true_precision.toString().slice(0,4) + ","
          + fake_precision.toString().slice(0,4) + ","
          + accuracy_type.toString().slice(0,4) + ","
          + accuracy_change.toString().slice(0,4) + ","
          + total_accuracy.toString().slice(0,4) + ","
          + accuracy_rate[0].toString().slice(0,4) + ","
          + accuracy_rate[1].toString().slice(0,4) + ","
          + accuracy_rate[2].toString().slice(0,4) + ","
          + accuracy_slices['T1'].toString().slice(0,4) + ","
          + accuracy_slices['T2'].toString().slice(0,4) + ","
          + accuracy_slices['T3'].toString().slice(0,4) + ","
          + accuracy_slices['T4'].toString().slice(0,4) + ","
          + accuracy_slices['T5'].toString().slice(0,4) + ","
          + accuracy_slices['T6'].toString().slice(0,4) + ","
          + accuracy_slices['T7'].toString().slice(0,4) + ","
          + accuracy_slices['T8'].toString().slice(0,4) + ","
          + accuracy_slices['T9'].toString().slice(0,4) + ","
          + accuracy_slices['T10'].toString().slice(0,4) + ","
          + accuracy_slices['T11'].toString().slice(0,4) + ","
          + accuracy_slices['T12'].toString().slice(0,4) 
          + "<br/>"              

  }  // ------------- Done with all participants 
  
  // console.log(total_TP,total_FP,total_TN, total_FN, total_accuracy, true_precision, fake_precision)          
  // console.log(accuracy_slices['T1'],accuracy_slices['T2'],accuracy_slices['T3'],accuracy_slices['T4'],accuracy_slices['T5'],accuracy_slices['T6'],accuracy_slices['T7'],accuracy_slices['T8'],accuracy_slices['T9'], accuracy_slices['T10'], accuracy_slices['T11'],accuracy_slices['T12'])
  // console.log(PerformanceString)
  // console.log(total_accuracy)
  res.send(PerformanceString)


}



// ---  user confusion matrics and performance over time --> 12-point
logging.userConfMatrix = async (req, res) => {


  var participantId = req.params.participantId
  var participantObjs = participantId.split(',');
  let count_cor = 0;
  let precision_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};


      let error_ai = {"T1":0,"T2":0,"T3":0};
      let error_human = {"T1":0,"T2":0,"T3":0};
      let error_human_ai = {"T1":0,"T2":0,"T3":0}

      // let recall_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};

  let PerformanceString = "TP, FP, TN, FN," +     // trust
                  "Accuracy," + // perceived accuracy in time
                  "True News Percision," + 
                  "Fake News Percision, "+
                  "T1-H, T2-, T3" +
                  "T1, T2, T3" +
                  "T1, T2, T3" +
                  "T1, T2,T3,T4,T5,T6,T7,T8,T9,T10,T11,T12" +
                  " <br/>"



  // ------------- start a loof for all participants --------------    

  for(let participant of participantObjs) {

      participantId = participant; 
      
      console.log('analysis done: ', participantId)


      let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
      let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()
      let taskRun;

      let all_surveys = ['mid_survey_1', 'mid_survey_2', 'end_survey_1', 'end_survey_2', 'survey_preStudy', 'post_study_survey']
      let response_forms = ['strategy', 'reasoning',  'limitation', 'additional']

      let average = (array) => array.reduce((a, b) => a + b) / array.length;

      var measures = {};
      let ai_claim_pred = 0       // show-claimPrediction
      let attr_exp_models = 0     // show-claimConfidences
      let attr_exp_article = 0    // show-explanation
      let attn_exp_claim = 0      // show-claimWords
      let attn_exp_article = 0    // show-articleWords
      let top3_exp_article = 0    // show-articleTopSentences

      let true_seen =0
      let fake_seen =0 
      let true_prediction =0
      let false_prediction =0 
      let true_shared = 0
      let fake_shared = 0
      let true_reported = 0
      let fake_reported = 0
      let true_guess = 0 
      let false_guess = 0

      let user_agreement = 0
      let user_disagreement = 0
      let user_agreement_exp = 0
      let user_disagreement_exp = 0
      let story_skipped = 0
      let story_selected = 0
      let story_reported = 0
      let article_selected = 0
      let article_inspected = 0
      let perceived_accuracy = [];
      

      measures.task_done = 0
      measures.user_engmnt = 0
      measures.user_response = 0
      measures.perceived_accuracy = 0

      let report_slice_1 = [];
      let report_slice_2 = [];
      let report_slice_3 = [];
      let report_rate = [];

      let performance_slice_1 = [];
      let performance_slice_2 = [];
      let performance_slice_3 = [];
      let performance_rate = [];
      

      let agreement_type = [];
      let agreement_slices = {"T1":[],"T2":[],"T3":[],"T4":[],"T5":[],"T6":[],"T7":[],"T8":[],"T9":[],"T10":[],"T11":[],"T12":[]};
      let agreement_slice_1 = [];
      let agreement_slice_2 = [];
      let agreement_slice_3 = [];
      let agreement_rate = [];


      let perc_acc_type = 0 
      let perc_acc_change = 0
      let conf_mat_slice_1 = [];
      let conf_mat_slice_2 = [];
      let conf_mat_slice_3 = [];

      let study_start_time = 0         // done
      let study_end_time = 0           // left -- 
      total_survey_time = 0
      total_article_time = 0
      last_time_stamp = 0;
      total_idle = 0;
      exp_checked = [];
      ai_checked = [];

      for(let interaction of interactionsForParticipant) {
          
          if (study_start_time == 0 && (interaction.action == 'study_start'  || interaction.action == 'showQuestions')){
              taskRun = interaction.taskRun       // task-run to get the user id, condtions, etc. 
              for(let detailName in interaction.details) {
                if (detailName == 'timestamp') {
                  study_start_time = interaction.details[detailName]
                  last_time_stamp = study_start_time;
                }
              }
          }

          // non-survey actions
          if (all_surveys.includes(interaction.action) == false){

            if (interaction.action != 'showTopic') measures.user_engmnt++;

            // ----- skip a story  -----
            if (interaction.action == 'skippedStory') {
              if (interaction.details['credibility'].includes('true')) true_seen++;
              else fake_seen++;

              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              }else{
                false_prediction++;
              }

              story_skipped++;
            } 
            // ----- End skip story  -----

            // ----- select a story  -----
            if (interaction.action == 'selectedStory') {
              // console.log("Select T"+(story_selected+1))
              // console.log(agreement_slices["T"+(story_selected+1)])
              //  TP: share a true news
              //  FP: share a fake news
              //  TN: report a fake news
              //  FN: report a true news 



              // if (story_selected < 4) this_error = "T1";
              // else if (story_selected < 8) this_error = "T2";
              // else this_error = "T3";


              // if (interaction.details['credibility'].includes('true')) {
              //   if (interaction.details['prediction'] == 'False') error_ai[this_error]+=1
              // }else{
              //   if (interaction.details['prediction'] == 'True') error_human[this_error]+=1
              //   else error_human_ai[this_error]+=1
              // }

              if (interaction.details['credibility'].includes('true')) {
                true_shared++;
                true_seen++;
                  
                  if (story_selected < 12){
                    precision_slices["T"+(story_selected+1)].push('TP');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('TP');
                  }

                if (story_selected < 4){
                  performance_slice_1.push('TP');
                }else if (story_selected < 8){
                  performance_slice_2.push('TP');
                }else{
                  performance_slice_3.push('TP');
                }

              } else {
                fake_shared++;
                fake_seen++;

                if (story_selected < 12){
                  precision_slices["T"+(story_selected+1)].push('FP');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('FP');
                  }

                if (story_selected < 4){
                  performance_slice_1.push('FP');
                }else if (story_selected < 8){
                  performance_slice_2.push('FP');
                }else{
                  performance_slice_3.push('FP');
                }

              }

              
              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {

                // ------------------ 
                if (story_selected < 4) this_error = "T1";
                else if (story_selected < 8) this_error = "T2";
                else this_error = "T3";


                if (interaction.details['credibility'].includes('true')) {
                  if (interaction.details['prediction'] == 'False') error_ai[this_error]+=1
                }else{
                  if (interaction.details['prediction'] == 'True') error_human[this_error]+=1
                  else error_human_ai[this_error]+=1
                }
                // ------------------

                if (interaction.details['prediction'] == 'True') {
                  user_agreement++;
                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }

                  agreement_type.push(1);  // -1: disagreement
                  if (story_selected < 4){
                    agreement_slice_1.push(1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(1);  // 1: agreement
                  }

                }
                if ((interaction.details['prediction'] == 'Fake') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement

                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(-1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(-1);
                  }

                  if (story_selected < 4){
                    agreement_slice_1.push(-1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(-1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(-1);  // 1: agreement
                  }
                }


                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }

              }else{   // -- did not checked AI --

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'True') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'Fake') ) user_disagreement_exp++;
                }
              }


              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ){ 
                true_prediction++;
              }else{
                false_prediction++;
              }

            // console.log(story_selected)
            story_selected++; 
            }
            // ----- End select a story  -----


            // ----- report a story  -----
            if (interaction.action == 'reportStory') {
              story_reported++;

              // if (story_selected < 4) this_error = "T1"
              // else if (story_selected < 8) this_error = "T2"
              // else this_error = "T3"

              // if (interaction.details['credibility'].includes('true')) {
              //   if (interaction.details['prediction'] == 'True') error_human_ai[this_error]+=1
              //   else error_human[this_error]+=1
              // }else{
              //   if (interaction.details['prediction'] == 'True') error_ai[this_error]+=1
              // }


              if (interaction.details['credibility'].includes('true')) {
                  true_reported++;    
                  true_seen++;

                if (story_selected < 12){
                  precision_slices["T"+(story_selected+1)].push('FN');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('FN');
                }

                if (story_selected < 4){
                  report_slice_1.push('FN');
                }else if (story_selected < 8){
                  report_slice_2.push('FN');
                }else{
                  report_slice_3.push('FN');
                }

              } else {    
                 fake_reported++;    
                 fake_seen++;    

                 if (story_selected < 12){
                  precision_slices["T"+(story_selected+1)].push('TN');
                  }else{
                    precision_slices["T"+(Math.floor(Math.random() * 4) + 9)].push('TN');
                }

                if (story_selected < 4){
                  report_slice_1.push('TN');
                }else if (story_selected < 8){
                  report_slice_2.push('TN');
                }else{
                  report_slice_3.push('TN');
                }
              }   

              // checked AI
              if (ai_checked.includes(interaction.details['claim_id']) ) {

                // -----------
                if (story_selected < 4) this_error = "T1"
                else if (story_selected < 8) this_error = "T2"
                else this_error = "T3"

                if (interaction.details['credibility'].includes('true')) {
                  if (interaction.details['prediction'] == 'True') error_human_ai[this_error]+=1
                  else error_human[this_error]+=1
                }else{
                  if (interaction.details['prediction'] == 'True') error_ai[this_error]+=1
                }
                // -----------
                
                if (interaction.details['prediction'] == 'Fake') {
                  user_agreement++;
                  agreement_type.push(1);  // 1: agreement
                  
                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(1);
                  }

                  if (story_selected < 4){
                    agreement_slice_1.push(1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(1);  // 1: agreement
                  }
                }
                if ((interaction.details['prediction'] == 'True') ) {
                  user_disagreement++;
                  agreement_type.push(-1);  // -1: disagreement
                  

                  if (story_selected < 12){
                  agreement_slices["T"+(story_selected+1)].push(-1);
                  }else{
                    agreement_slices["T"+(Math.floor(Math.random() * 4) + 9)].push(-1);
                  }


                  if (story_selected < 4){
                    agreement_slice_1.push(-1);  // 1: agreement
                  }else if (story_selected < 8){
                    agreement_slice_2.push(-1);  // 1: agreement
                  }else{
                    agreement_slice_3.push(-1);  // 1: agreement
                  }
                }

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }

              }else{   // did not checked AI

                // checked Explanations
                if (exp_checked.includes(interaction.details['claim_id']) ) {
                  if (interaction.details['prediction'] == 'Fake') user_agreement_exp++;
                  if ((interaction.details['prediction'] == 'True') ) user_disagreement_exp++;
                }
              }


              // if ((interaction.details['prediction'] == 'Fake') && ai_checked.includes(interaction.details['claim_id']) ) user_agreement++;
              // if ((interaction.details['prediction'] == 'True') && ai_checked.includes(interaction.details['claim_id']) ) user_disagreement++;

              // if ((interaction.details['prediction'] == 'Fake') && exp_checked.includes(interaction.details['claim_id']) ) user_agreement_exp++;
              // if ((interaction.details['prediction'] == 'True') && exp_checked.includes(interaction.details['claim_id']) ) user_disagreement_exp++;

           
              // model accuracy
              if ((interaction.details['prediction'] == 'True')  && interaction.details['credibility'].includes('true') ) {
                true_prediction++;
              } else if ((interaction.details['prediction'] == 'Fake')  && interaction.details['credibility'].includes('false') ) {
                true_prediction++;
              } else {
                false_prediction++;
              }

            }
            // ----- End report a story  -----

            // ----- Other than skip, share, and report: -----

            if (interaction.action == 'showArticle') article_inspected++;
            if (interaction.action == 'chooseArticle') article_selected++;
            
            if ((interaction.action == 'show-claimPrediction') && !ai_checked.includes(interaction.details['topic'])) {
              ai_claim_pred++; 
              ai_checked.push(interaction.details['topic'])
            }

            //  attn
            if ((interaction.action == 'show-claimWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_claim++;
              exp_checked.push(interaction.details['topic']);
            }
            if ((interaction.action == 'show-articleWords')  && !exp_checked.includes(interaction.details['topic'])) {
              attn_exp_article++;
              exp_checked.push(interaction.details['topic']);
            };

            //  attr
            if ((interaction.action == 'show-claimConfidences')  && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_models++;
              exp_checked.push(interaction.details['topic'])
            } 
            if ((interaction.action == 'show-explanation')   && !exp_checked.includes(interaction.details['topic'])) {
              attr_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }
            if ((interaction.action == 'show-articleTopSentences')   && !exp_checked.includes(interaction.details['topic'])) {
              top3_exp_article++;
              exp_checked.push(interaction.details['topic'])
            }

            true_list = ['true', 'true?','ture','tru']
            false_list = ['false','fake', 'fake?','false?']  

            if ((interaction.details['credibility']) && (interaction.action == 'userGuess')) {
              user_guess = interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase()  // .replace(/ /g, '').replace(/True?orFake?/g, '').toLowerCase()  //True? or Fake?
              if (true_list.includes(user_guess) && interaction.details['credibility'].includes('true')) true_guess++;
              else if (false_list.includes(user_guess) && interaction.details['credibility'].includes('false')) true_guess++;
              else if (!true_list.includes(user_guess) && !false_list.includes(user_guess)) console.log('new user guess comment:>>', interaction.details['guess'],'<<') // '-->>',interaction.details['guess'].replace(/ /g, '').replace('True?orFake?', '').replace(/ /g, '').toLowerCase(),"<<");
              else false_guess++;
            } 

              
            
            study_end_time = interaction.details['timestamp']
            if ((study_end_time - last_time_stamp) / 60 > 3){          // --  3 minutes threshold idle 
              total_idle += study_end_time - last_time_stamp;
            }
            last_time_stamp = study_end_time;
          
          // ---- surveys actions  ---- 
          }else{

            // 'mid_survey_1', 'mid_survey_2', 'end_survey_1'
            for(let detailName in interaction.details) {
              if (detailName == 'mental_model_range' ) {
                  perceived_accuracy.push(parseInt(interaction.details[detailName]))
              }
            } 
            

            if (interaction.action == 'post_study_survey' || interaction.action == 'end_survey_2'){  
              measures.task_done = 'ture'

              for(let detailName in interaction.details) {
                if (response_forms.includes(detailName) )  {
                  measures.user_response += interaction.details[detailName].toString().split(" ").length;
                }

                if (detailName == 'mental_model_range' )  {
                    measures.perceived_accuracy = interaction.details[detailName] 
                }

              } 

            }
            for(let detailName in interaction.details) {
              if (detailName == 'timestamp') {
                study_end_time = interaction.details[detailName]
                total_survey_time += study_end_time - last_time_stamp;
                last_time_stamp = study_end_time
              }
            } 

          }
          // ---- End of surveys actions  ---- 
      }
      // ---- End of all interactions  ---- 

      // console.log('agreement_slices: ', agreement_slices)
      
      measures.claim_inspected = story_skipped + story_selected + story_reported; 
      measures.article_inspected = article_inspected / (story_reported + story_selected); 
      
      measures.prediction_inspectin = ai_claim_pred / (story_reported + story_selected); 

      // console.log(ai_claim_pred, '==', (story_skipped + story_selected + story_reported),  '=!', (user_agreement + user_disagreement + story_skipped))

      measures.claim_exp_inspectin = (attr_exp_models + attn_exp_claim)  / (story_reported + story_selected); 
      // measures.claim_exp_inspectin_slc = (attr_exp_models + attn_exp_claim) / (story_selected);
      // measures.claim_exp_inspectin_skp = (attr_exp_models + attn_exp_claim) / (story_skipped);
      measures.artilce_exp_inspectin = (attr_exp_article + attn_exp_article + top3_exp_article)  / (story_reported + story_selected);

      measures.user_shared_veracity = true_shared / (true_shared + fake_shared);
      // console.log(true_shared, fake_shared)
      measures.user_reported_veracity = fake_reported / (true_reported + fake_reported);

      measures.user_agreement = user_agreement / (user_agreement + user_disagreement); // (story_reported + story_selected); // (true_shared + fake_reported);
      measures.user_agreement_exp = user_agreement_exp / (user_agreement_exp + user_disagreement_exp); // (story_reported + story_selected); // (true_shared + fake_reported);

      // console.log(true_guess, false_guess, true_guess / (true_guess + false_guess))
      measures.user_prediction = true_guess / (true_guess + false_guess)    // user prediction task 
      
      measures.news_veracity = true_seen / (true_seen + fake_seen);                        // check news veracity for all
      measures.model_accuracy = true_prediction / (true_prediction + false_prediction);    // check model accuracy for all
      // measures.user_engmnt 
      measures.task_duration = (study_end_time - study_start_time) / 60 - (total_idle / 60);  // total_article_time
      measures.payment = (measures.task_duration / 60) * 10;
      measures.total_survey_time = total_survey_time / 60;
      measures.total_article_time = measures.task_duration - measures.total_survey_time;

      measures.perceived_accuracy_avg = average(perceived_accuracy)
      perc_acc_change = perceived_accuracy[2] - perceived_accuracy[0];
      
      
      // --- Precision in Time --- 

      


      //  TP: share a true news
      //  FP: share a fake news
      result_TP = performance_slice_1.filter(i => i === "TP").length; 
      result_FP = performance_slice_1.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));
      result_TP = performance_slice_2.filter(i => i === "TP").length; 
      result_FP = performance_slice_2.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));
      result_TP = performance_slice_3.filter(i => i === "TP").length; 
      result_FP = performance_slice_3.filter(i => i === "FP").length;
      performance_rate.push(result_TP/(result_TP+result_FP));    // <<-- Precision of shared true news

      // console.log('user_shared_veracity: ', performance_rate, measures.user_shared_veracity, performance_rate.reduce((partial_sum, a) => partial_sum + a,0)/3)
      // console.log(performance_slice_1,performance_slice_2,performance_slice_3)



      //  TN: report a fake news
      //  FN: report a true news 
      rate = 0;
      result_TN = report_slice_1.filter(i => i === "TN").length; 
      result_FN = report_slice_1.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {
        rate = result_TN/(result_TN+result_FN)
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }
      result_TN = report_slice_2.filter(i => i === "TN").length; 
      result_FN = report_slice_2.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {  
        rate = result_TN/(result_TN+result_FN)
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }
      result_TN = report_slice_3.filter(i => i === "TN").length; 
      result_FN = report_slice_3.filter(i => i === "FN").length;
      if (result_TN+result_FN > 0) {
        rate = result_TN/(result_TN+result_FN)   // <<-- Precision of reported fake news
        report_rate.push(rate);
      } else {
        report_rate.push(rate)
      }  
      // console.log('user_fake_reported: ', report_rate, measures.user_reported_veracity, report_rate.reduce((partial_sum, a) => partial_sum + a,0)/3)
      // console.log(report_slice_1,report_slice_2,report_slice_3)



      agreement_rate.push(agreement_slice_1.filter(i => i === 1).length / agreement_slice_1.length);
      agreement_rate.push(agreement_slice_2.filter(i => i === 1).length / agreement_slice_2.length);
      agreement_rate.push(agreement_slice_3.filter(i => i === 1).length / agreement_slice_3.length);

      // console.log('agreement_rate:  ', agreement_slice_1, agreement_slice_2, agreement_slice_3);
      // console.log(performance_slice_1,performance_slice_2,performance_slice_3)
      // console.log(slice_1.reduce((partial_sum, a) => partial_sum + a,0), slice_2.reduce((partial_sum, a) => partial_sum + a,0) , slice_3.reduce((partial_sum, a) => partial_sum + a,0) )
      // console.log(perceived_accuracy[0],perceived_accuracy[1],perceived_accuracy[2])

      // Type 1: down-down 
      // Type 2: down-up
      // Type 3: up-up
      // Type 4: up-down
      // Type 5: same-same
      const acc_threshold = 2;
      if ((perceived_accuracy[0] > perceived_accuracy[1]) & (perceived_accuracy[1] > perceived_accuracy[2])) {
        perc_acc_type = 1;
      } else if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) & ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold)) {
        perc_acc_type = 2;
      } else if ((perceived_accuracy[0] < perceived_accuracy[1]) & (perceived_accuracy[1] < perceived_accuracy[2])) {
        perc_acc_type = 3;
      } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) & ((perceived_accuracy[1] - perceived_accuracy[2]) > acc_threshold)) {
        perc_acc_type = 4;
      } else {
        // if (((perceived_accuracy[0] - perceived_accuracy[1]) > acc_threshold) || ((perceived_accuracy[1] - perceived_accuracy[2]) > 3) ) {
          if ( (perceived_accuracy[0] - perceived_accuracy[2]) > 2 * acc_threshold) {
           perc_acc_type = 1;
           // } else if (((perceived_accuracy[1] - perceived_accuracy[0]) > acc_threshold) || ((perceived_accuracy[2] - perceived_accuracy[1]) > acc_threshold) ) {
          } else if ( (perceived_accuracy[2] - perceived_accuracy[0]) > 2 * acc_threshold ) {
            perc_acc_type = 3;
          } else {
            perc_acc_type = 5;
            console.log('no change!: ', perceived_accuracy);
          }
      }


      const agreement_threshold = 0.01;
      if ((agreement_rate[0] > agreement_rate[1]) & (agreement_rate[1] > agreement_rate[2])) {
        usr_agreement_type = 1;
      } else if (((agreement_rate[0] - agreement_rate[1]) > agreement_threshold) & ((agreement_rate[2] - agreement_rate[1]) > agreement_threshold)) {
        usr_agreement_type = 2;
      } else if ((agreement_rate[0] < agreement_rate[1]) & (agreement_rate[1] < agreement_rate[2])) {
        usr_agreement_type = 3;
      } else if (((agreement_rate[1] - agreement_rate[0]) > agreement_threshold) & ((agreement_rate[1] - agreement_rate[2]) > agreement_threshold)) {
        usr_agreement_type = 4;
      } else {
          if ( (agreement_rate[0] - agreement_rate[2]) > 2 * agreement_threshold) {
           usr_agreement_type = 1;
          } else if ( (agreement_rate[2] - agreement_rate[0]) > 2 * agreement_threshold ) {
            usr_agreement_type = 3;
          } else {
            usr_agreement_type = 5;
            console.log('no change!: ', agreement_rate);
          }
      } 
      usr_agreement_change = agreement_rate[2] - agreement_rate[0];

      const performance_threshold = 0.01;
      if ((performance_rate[0] > performance_rate[1]) & (performance_rate[1] > performance_rate[2])) {
        performance_type = 1;
      } else if (((performance_rate[0] - performance_rate[1]) > performance_threshold) & ((performance_rate[2] - performance_rate[1]) > agreement_threshold)) {
        performance_type = 2;
      } else if ((performance_rate[0] < performance_rate[1]) & (performance_rate[1] < performance_rate[2])) {
        performance_type = 3;
      } else if (((performance_rate[1] - performance_rate[0]) > performance_threshold) & ((performance_rate[1] - performance_rate[2]) > agreement_threshold)) {
        performance_type = 4;
      } else {
          if ( (performance_rate[0] - performance_rate[2]) > 2 * performance_threshold) {
           performance_type = 1;
          } else if ( (performance_rate[2] - performance_rate[0]) > 2 * performance_threshold ) {
            performance_type = 3;
          } else {
            performance_type = 5;
            console.log('no change!: ', performance_rate);
          }
      } 
      performance_change = performance_rate[2] - performance_rate[0];
      

      if ((report_rate[0] > report_rate[1]) & (report_rate[1] > report_rate[2])) {
        report_type = 1;
      } else if (((report_rate[0] - report_rate[1]) > performance_threshold) & ((report_rate[2] - report_rate[1]) > agreement_threshold)) {
        report_type = 2;
      } else if ((report_rate[0] < report_rate[1]) & (report_rate[1] < report_rate[2])) {
        report_type = 3;
      } else if (((report_rate[1] - report_rate[0]) > performance_threshold) & ((report_rate[1] - report_rate[2]) > agreement_threshold)) {
        report_type = 4;
      } else {
          if ( (report_rate[0] - report_rate[2]) > 2 * performance_threshold) {
           report_type = 1;
          } else if ( (report_rate[2] - report_rate[0]) > 2 * performance_threshold ) {
            report_type = 3;
          } else {
            report_type = 5;
            console.log('no change!: ', report_rate);
          }
      } 
      report_change = report_rate[2] - report_rate[0];

  }  // ------------- Done with all participants 


  //  -- Calculate average performance for T1-T12 

  //  TP: share a true news .
  //  FP: share a fake news . 
  //  TN: report a fake news.
  //  FN: report a true news.
  let accuracy_slices = {"T1":0,"T2":0,"T3":0,"T4":0,"T5":0,"T6":0,"T7":0,"T8":0,"T9":0,"T10":0,"T11":0,"T12":0};
  total_TN = 0;
  total_TP = 0;
  total_FN = 0;
  total_FP = 0;
  console.log('agreement_slices: ', precision_slices)
  
  for (i=0;i<12;i++){ 
    this_index = "T"+(i+1);
    result_TP = precision_slices[this_index].filter(i => i === "TP").length; 
    result_FP = precision_slices[this_index].filter(i => i === "FP").length;
    result_TN = precision_slices[this_index].filter(i => i === "TN").length; 
    result_FN = precision_slices[this_index].filter(i => i === "FN").length;

    accuracy_slices[this_index] = (result_TP + result_TN)/(result_TP+result_TN+result_FP+result_FN);  

    total_TN+=result_TN
    total_TP+=result_TP
    total_FN+=result_FN
    total_FP+=result_FP
  }

  // error_ai['T1']+=1
  // error_human['T1']+=1
  // error_human_ai['T1']+=1

  console.log("error_ai", error_ai)
  console.log("error_human", error_human)
  console.log("error_human_ai",error_human_ai)

  total_accuracy = (total_TP + total_TN)/(total_TP+total_TN+total_FP+total_FN);
  true_precision = total_TP/(total_TP+total_FP);
  fake_precision = total_TN/(total_TN+total_TP); 

  PerformanceString += 
          total_TP.toString().slice(0,4) + ","
          + total_FP.toString().slice(0,4) + ","
          + total_TN.toString().slice(0,4) + ","
          + total_FN.toString().slice(0,4) + ","
          + total_accuracy.toString().slice(0,4) + ","
          + true_precision.toString().slice(0,4) + ","
          + fake_precision.toString().slice(0,4) + ","
          + error_human['T1'].toString().slice(0,4) + ","
          + error_ai['T1'].toString().slice(0,4) + ","
          + error_human_ai['T1'].toString().slice(0,4) + ","
          + error_human['T2'].toString().slice(0,4) + ","
          + error_ai['T2'].toString().slice(0,4) + ","
          + error_human_ai['T2'].toString().slice(0,4) + ","
          + error_human['T3'].toString().slice(0,4) + ","
          + error_ai['T3'].toString().slice(0,4) + ","
          + error_human_ai['T3'].toString().slice(0,4) + ","
          + accuracy_slices['T1'].toString().slice(0,4) + ","
          + accuracy_slices['T2'].toString().slice(0,4) + ","
          + accuracy_slices['T3'].toString().slice(0,4) + ","
          + accuracy_slices['T4'].toString().slice(0,4) + ","
          + accuracy_slices['T5'].toString().slice(0,4) + ","
          + accuracy_slices['T6'].toString().slice(0,4) + ","
          + accuracy_slices['T7'].toString().slice(0,4) + ","
          + accuracy_slices['T8'].toString().slice(0,4) + ","
          + accuracy_slices['T9'].toString().slice(0,4) + ","
          + accuracy_slices['T10'].toString().slice(0,4) + ","
          + accuracy_slices['T11'].toString().slice(0,4) + ","
          + accuracy_slices['T12'].toString().slice(0,4) 
          + "<br/>"              

  // console.log(total_TP,total_FP,total_TN, total_FN, total_accuracy, true_precision, fake_precision)          
  // console.log(accuracy_slices['T1'],accuracy_slices['T2'],accuracy_slices['T3'],accuracy_slices['T4'],accuracy_slices['T5'],accuracy_slices['T6'],accuracy_slices['T7'],accuracy_slices['T8'],accuracy_slices['T9'], accuracy_slices['T10'], accuracy_slices['T11'],accuracy_slices['T12'])
  // console.log(PerformanceString)
  // console.log(total_accuracy)
  res.send(PerformanceString)


}


logging.payment = async (req, res) => {
  const participantId = req.params.participantId
  let participantTaskRuns = await TaskRun.find({participant_id: participantId}).select('_id').lean().exec()
  let interactionsForParticipant = await Interaction.find({ taskRun: { $in: participantTaskRuns } }).populate('taskRun').lean().exec()
  // console.log("found interactions: "+interactionsForParticipant.length);
  let taskRun;

  let all_surveys = ['mid_survey_1', 'mid_survey_2', 'end_survey_1', 'end_survey_2', 'survey_preStudy', 'post_study_survey']
  let response_forms = ['strategy', 'reasoning',  'limitation', 'additional']

  var measures = {};
  let ai_claim_pred = 0       // show-claimPrediction
  let attr_exp_models = 0     // show-claimConfidences
  let attr_exp_article = 0    // show-explanation
  let attn_exp_claim = 0      // show-claimWords
  let attn_exp_article = 0    // show-articleWords
  let top3_exp_article = 0    // show-articleTopSentences

  let true_seen =0
  let fake_seen =0 
  let true_prediction =0
  let false_prediction =0 
  let true_shared = 0
  let fake_shared = 0
  let true_reported = 0
  let fake_reported = 0
  let true_guess = 0 
  let false_guess = 0

  let user_agreement = 0
  let user_disagreement = 0
  let story_skipped = 0
  let story_selected = 0
  let story_reported = 0
  let article_selected = 0
  let article_inspected = 0
  measures.task_done = 0
  measures.user_engmnt = 0
  measures.user_response = 0
  measures.perceived_accuracy = 0
  measures.perceived_accuracy_avg =0

  let study_start_time = 0         // done
  let study_end_time = 0           // left -- 
  total_survey_time = 0
  total_article_time = 0
  last_time_stamp = 0;
  total_idle = 0;
  exp_claim_checked = {};
  ai_checked = [];

  for(let interaction of interactionsForParticipant) {
      
      if (study_start_time == 0 && (interaction.action == 'study_start'  || interaction.action == 'showQuestions')){
          taskRun = interaction.taskRun       // task-run to get the user id, condtions, etc. 
          for(let detailName in interaction.details) {
            if (detailName == 'timestamp') {
              study_start_time = interaction.details[detailName]
              last_time_stamp = study_start_time;
            }
          }
      }

      // non survey actions
      if (all_surveys.includes(interaction.action) == false){

        study_end_time = interaction.details['timestamp']
        if ((study_end_time - last_time_stamp) / 60 > 3){          // --  3 minutes threshold idle 
          total_idle += study_end_time - last_time_stamp;
        }
        last_time_stamp = study_end_time;

      
      // ---- surveys actions  ---- 
      }else{
    
        


        for(let detailName in interaction.details) {
          if (detailName == 'timestamp') {
            study_end_time = interaction.details[detailName]
            total_survey_time += study_end_time - last_time_stamp;
            last_time_stamp = study_end_time
          }
        } 

      }
  } 

  // measures.user_engmnt 
  measures.task_duration = (study_end_time - study_start_time) / 60 - (total_idle/60);  // total_article_time
  measures.payment = (measures.task_duration / 60) * 10;
  measures.total_survey_time = total_survey_time / 60;
  measures.total_article_time = measures.task_duration - measures.total_survey_time;
  // --- Generate a CSV of all results  ---


  // let taskRun = interaction.taskRun

  let csvString = "ID, condition, " + 
                  "HIT duration,paymant, task duration,survey duration<br/>"

  csvString += taskRun.participant_id + ","
      + taskRun.condition_order[taskRun.current_condition] + ","
      + measures.task_duration.toString().slice(0,4) + ","
      + measures.payment.toString().slice(0,4) + ","
      + measures.total_article_time.toString().slice(0,4) + ","
      + measures.total_survey_time.toString().slice(0,4) 
      + "<br/>"

  res.send(csvString)
}

module.exports = logging
