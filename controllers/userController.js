const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('firstname');
  req.checkBody('firstname', 'SubhanaLlah! You must supply a first name!').notEmpty();
  req.sanitizeBody('surname');
  req.checkBody('surname', 'SubhanaLlah! You must supply a last name!').notEmpty();
  req.checkBody('phone_no', 'SubhanaLlah! You must supply a valid phone number!').notEmpty();
  req.checkBody('email', 'SubhanaLlah! That Email is not valid!').isEmail().notEmpty(); 
  req.sanitizeBody('email').normalizeEmail({
    gmail_remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'SubhanaLlah! Password Cannot be Blank!').notEmpty();
  req.checkBody('password-confirm', 'SubhanaLlah! Confirmed Password cannot be blank!').notEmpty();
  req.checkBody('password-confirm', 'SubhanaLlah! Your passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
    return; // stop the fn from running
  }
  next(); // there were no errors!
};


exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, firstname: req.body.firstname, surname: req.body.surname, phone_no: req.body.phone_no });
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next(); // pass to authController.login
};

exports.account = (req, res) => {
  res.render('account', { title: 'Edit Your Account' });
};

exports.updateAccount = async (req, res) => {
  const updates = {
    firstname: req.body.firstname,
    surname: req.body.surname,
    phone_no: req.body.phone_no,
    email: req.body.email
  };

  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  );
  req.flash('success', 'SubhanaLlah! You have Updated the profile!');
  res.redirect('back');
};
