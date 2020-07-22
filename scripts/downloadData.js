process.env.NODE_ENV = 'atlas'

const TaskRun = require('../models/TaskRun');
const Interaction = require('../models/Interaction');
const mongoose = require('mongoose')
const config = require('config')


const countCompleteTasks = async(batchFolder) => {
  let allTasks = await TaskRun.find({}).lean()
  console.log("all task runs: "+allTasks.length);

  let completed = 0;
  let participants = [];
  for(let task of allTasks) {
    if(task.flags.post_study == true) {
      completed++
      participants.push(task.participant_id)
    }
  }
  console.log("completed studies: "+completed);
  //console.log("participant id, task, condition, selected articles")

  console.log("participant id, task, topic 1, topic 2, topic 3, topic 4, topic 5, topic 6")


  //console.log("participant id, understand, detail, satisfying, seemComplete, howToUse, goals, understandAccuracy, trust, additional")
  for(let p of participants){
    await outputParticipantData(p)
  }
}

const outputParticipantData = async(participant_id) => {
  //console.log(participant_id)

  let tasks =  await TaskRun.find({participant_id: participant_id}).lean()
  //console.log(tasks.length)
  let task1 = null
  let task2 = null
  if(tasks.length == 4) {
    //tasks = [tasks[0], tasks[3]]
  }

  for(let t of tasks)
  {
    if(tasks.length == 4 && t.flags.mid_study_one == false)
      continue

    if(t.flags.post_study)
    {
      task2 = t
    } else if(t.flags.post_condition)
    {
      task1 = t
    }

    if(task1 != null && task2 != null)
      break;
  }

  //await outputSurveyData(participant_id, task1)
  //await outputTaskRunData(participant_id, task1, "Task 1")
  await outputTaskRunData(participant_id, task2, "Task 2")
}

const outputTaskRunData = async(participant_id, taskRun, taskName) => {

  let showTopics = await Interaction.find({taskRun: taskRun, action : "showTopic"}).lean()
  let showQuestions = await Interaction.find({taskRun: taskRun, action : "showQuestions"}).lean()

  showTopics.sort(function(a, b){return a.createdAt - b.createdAt})
  showQuestions.sort(function(a, b){return a.createdAt - b.createdAt})

  //console.log(showTopics)
  let questionIndex = 0;
  let topicIndex = 0;
  let times = "";
  let currentTopic = "";

  let topicStarts = [];
  let topicTimes = "";
  let questionTimes = "";
  let midQuestionsStart = 0;
  let postQuestionsStart = 0;

  let firstTopicTime = new Date(showTopics[0].createdAt);
  for(let question of showQuestions) {
    let qTime = new Date(question.createdAt)

    questionTimes += qTime.toTimeString().slice(0, 8) + ",";

    //console.log("q time: "+ qTime)
    if(qTime > firstTopicTime)
    {
      midQuestionsStart = qTime;
    }
    else if(qTime > midQuestionsStart)
    {
      postQuestionsStart = qTime;
    }
  }

  for(let topic of showTopics){
    if(topic.details.topic != currentTopic) {
      currentTopic = topic.details.topic;
      topicTimes += new Date(topic.createdAt).toTimeString().slice(0, 8) + ",";
      topicStarts[topicIndex] = new Date(topic.createdAt);
      topicIndex++;
    }
  }
  console.log(participant_id +", " + taskName)
  console.log(questionTimes)
  console.log(topicTimes)

/*
  let finalSurvey = await Interaction.findOne({taskRun: taskRun, action : "survey - post_study"})
  if(finalSurvey == null)
    console.log(participant_id + ",,,")
  else {
    console.log(participant_id + ","
      + finalSurvey.details.understand + ","
      + finalSurvey.details.detail + ","
      + finalSurvey.details.satisfying + ","
      + finalSurvey.details.seemComplete + ","

      + finalSurvey.details.howToUse + ","
      + finalSurvey.details.goals + ","
      + finalSurvey.details.understandAccuracy + ","
      + finalSurvey.details.trust + ","

      + finalSurvey.details.additional
     );
   }
   */
}

const run = async() => {
  try {
    await mongoose.connect(config.database.connectionString, { useNewUrlParser : true })
    await countCompleteTasks();

    process.exit()

  } catch (err) {
      console.log(err)
  }
}

run();
