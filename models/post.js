/*
 * POST MODEL
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CommentSchema = new Schema({
    body        : { type: String, required: true }
  , flagged     : { type: Boolean, default: false }
  , created_at  : { type: Date }
  , updated_at  : { type: Date }
});

// // create a comment
// post.comments.push({ title: 'My comment' });

// post.save(function (err) {
//   if (!err) console.log('Success!');
// });

var PostSchema = new Schema({
    created_at  : { type: Date }
  , updated_at  : { type: Date }
  , body        : { type: String, required: true, trim: true }
  , votes_count : { type: Number, required: true, default: 0 }
  , room_name   : { type: String, required: true, trim: true }
  , comments    : [CommentSchema]
  // , author: {}
});

// PostSchema.virtual('fullname').get(function() {
//   return this.first + ' ' + this.last;
// });

// BEFORE/AFTER FILTER
// PostSchema.pre('save', function(next) {
// if (something) {
// next()
// } else {
// next(new Error('No can do, sir!'));
// }
// });

CommentSchema.pre('save', function(next){
  // SET CREATED_AT AND UPDATED_AT
  now = new Date();
  this.updated_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();

  // ENCRYPT PASSWORD
  if (this.password) {
    var md5 = crypto.createHash('md5');
    this.password = md5.update(this.password).digest('hex');
  }
  next();
});

PostSchema.pre('save', function(next){
  // SET CREATED_AT AND UPDATED_AT
  now = new Date();
  this.updated_at = now;
  if ( !this.created_at ) {
    this.created_at = now;
  }
  next();

  // ENCRYPT PASSWORD
  if (this.password) {
    var md5 = crypto.createHash('md5');
    this.password = md5.update(this.password).digest('hex');
  }
  next();
});

// SETTER
// function obfuscate (cc) {
//   return '****-****-****-' + cc.slice(cc.length-4, cc.length);
// }

// var AccountSchema = new Schema({
//   creditCardNumber: { type: String, get: obfuscate }
// });

mongoose.model('Post', PostSchema);
mongoose.model('Comment', CommentSchema);