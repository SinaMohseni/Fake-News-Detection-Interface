const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const topicSchema = mongoose.Schema({
  claim_id : String,
  claim : String,
  credibility : String,
  description : String,
  example : String,
  fact_check : String,
  last_updated : String,
  originally_published : String,
  origins : String,
  referred_links : [
    String
  ],
  tags : [
    String
  ],
  url : String,
  nicOK : { type: Boolean, default: false },
  articles : [
    {
      type: ObjectId,
      ref : 'Article_ood'
    }
  ],
  output_version : Number,
  claim_attentions: [
    {
      phrase : String,
      attention : Number,
      _id: false
    }
  ],
  confidences : {
    model_1 : Number,
    model_2 : Number,
    model_3 : Number,
    model_4 : Number,
    model_1_clm : Number,
    model_4_art : Number,
    model_1_4: Number,
    model_2_3: Number,
    overall : Number
  },
  prediction_overall : String,
  prediction_1_4 : String,
  prediction_2_3 : String,
  editorial_score : Number
  }, 
  { timestamps: { createdAt: 'createdAt', updatedAt : 'updatedAt' } 
})


module.exports = mongoose.model('Topic_ood', topicSchema);


