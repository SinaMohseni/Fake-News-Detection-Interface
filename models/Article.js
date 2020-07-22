const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;

const articleSchema = mongoose.Schema({
  domain : String,
  link : String,
  link_type : String,
  text : String,
  title : String,
  topic : {
    type: ObjectId,
    ref : 'Topic'
  },
  article_relevance : Number,
  importance : {
    article : Number,
    article_source : Number,
    claim : Number,
    claim_source : Number
  },
  top_sentences: [
    String
  ],
  attentions : [
    [String, Number]
  ],
  unfluffed : Mixed
}, { timestamps: { createdAt: 'createdAt', updatedAt : 'updatedAt' } })

module.exports = mongoose.model('Article', articleSchema);
