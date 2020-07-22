process.env.NODE_ENV = 'mongoAtlas'
const TaskRun = require('../models/TaskRun');
const mongoose = require('mongoose')
const config = require('config')

const run = async() => {
  try {
    await mongoose.connect(config.database.connectionString, { useNewUrlParser : true })

    let allTaskRuns = await TaskRun.find({}).lean()
    console.log("TaskRun Count: ", allTaskRuns.length)
    console.log(allTaskRuns[0]);
    console.log(allTaskRuns[1]);

    return;
  } catch (err) {
      console.log(err)
  }
  process.exit()
}

run();
