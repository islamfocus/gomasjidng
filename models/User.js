const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'SubhanaLlah! Invalid Email Address'],
    required: 'SubhanaLlah! Please Supply an email address'
  },
  firstname: {
    type: String,
    required: 'SubhanaLlah! Please supply a first name',
    trim: true
  },
  surname: {
    type: String,
    required: 'SubhanaLlah! Please supply a last name',
    trim: true
  },
  phone_no: {
    type: Number,
    unique: true,
    trim: true,
    required: 'SubhanaLlah! Please supply a valid phone number',
  },
  choices: {
    type: [String]
  },

  resetPasswordToken: String,
  resetPasswordExpires: Date,
  hearts: [
    { type: mongoose.Schema.ObjectId, ref: 'Masjid' }
  ]
});

userSchema.virtual('gravatar').get(function() {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);
