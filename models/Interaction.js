const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;

const interactionSchema = mongoose.Schema({
  taskRun : {
    type: ObjectId,
    ref : 'TaskRun'
  },
  action : String,
  details : Mixed,
}, { timestamps: { createdAt: 'createdAt', updatedAt : 'updatedAt' } })

module.exports = mongoose.model('Interaction', interactionSchema);