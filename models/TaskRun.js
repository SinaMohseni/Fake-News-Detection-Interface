const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const taskRunSchema = mongoose.Schema({
  participant_id : String,
  studyType : String,
  condition_order : [
    String
  ],
  current_condition : Number,
  mturk_id: String,
  accuracy : Number,
  last_skip : String,
  flags : {
    consented: { type: Boolean, default: false },
    pre_study: { type: Boolean, default: false },
    instructions: { type: Boolean, default: false },
    mid_survey_1_done: { type: Boolean, default: false },
    mid_survey_2_done: { type: Boolean, default: false },
    end_survey_1_done: { type: Boolean, default: false },
    end_survey_2_done: { type: Boolean, default: false },
    final_survey_done: { type: Boolean, default: false },
    prediction_task: { type: Boolean, default: false }
  },
  studyProcedure: {
    first_sec: { type: Number, default: 1 },
    sencond_sec: { type: Number, default: 1 },
    third_sec: { type: Number, default: 1 },
    fourth_sec: { type: Number, default: 1 }
  },
  current_topic : Number,
  current_selected_topic : Number,
  totalStories: Number,
  presented_topics : [
    {
      type: ObjectId,
      ref : 'Topic'
    }
  ],
  chosen_articles : [
    {
      type: ObjectId,
      ref : 'Article'
    }
  ],

  score: Number,
  completionText : String,
  show_survey: String,
  is_done: { type: Boolean, default: false },

  game_stats: {
    plays: Number,
    correct: Number,
    condition: String,
  }
}, { timestamps: { createdAt: 'createdAt', updatedAt : 'updatedAt' } })

module.exports = mongoose.model('TaskRun', taskRunSchema);
