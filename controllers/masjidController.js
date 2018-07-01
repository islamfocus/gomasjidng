const mongoose = require('mongoose');
const Masjid = mongoose.model('Masjid');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto) {
      next(null, true);
    } else {
      next({ message: 'SubhanalLah! That filetype isn\'t allowed!' }, false);
    }
  }
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addMasjid = (req, res) => {
  res.render('editMasjid', { title: 'Register Masjid' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, keep going!
  next();
};

exports.createMasjid = async (req, res) => {
  req.body.author = req.user._id;
  const masjid = await (new Masjid(req.body)).save();
  req.flash('success', `AlhamdulilLah! You have Successfully registered ${masjid.name}. Care to leave a review?`);
  res.redirect(`/masjid/${masjid.slug}`);
};

exports.getMasajid = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = (page * limit) - limit;

  // 1. Query the database for a list of all masajid
  const masajidPromise = Masjid
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPromise = Masjid.count();

  const [masajid, count] = await Promise.all([masajidPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!masajid.length && skip) {
    req.flash('info', `SubhanalLah! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/masajid/page/${pages}`);
    return;
  }

  res.render('masajid', { title: 'Masajid', masajid, page, pages, count });
};

const confirmOwner = (masjid, user) => {
  if (!masjid.author.equals(user._id)) {
    throw Error('SubhanalLah! You must register a masjid in order to edit it!');
  }
};


exports.editMasjid = async (req, res) => {
  // 1. Find the masjid given the ID
  const masjid = await Masjid.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the masjid
  confirmOwner(masjid, req.user);
  // 3. Render out the edit form so the user can update their masjid
  res.render('editMasjid', { title: `Edit ${masjid.name}`, masjid });
};

exports.updateMasjid = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = 'Point';
  // find and update the masjid
  const masjid = await Masjid.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new masjid instead of the old one
    runValidators: true
  }).exec();
  req.flash('success', `AlhamdulilLah! You have Successfully updated <strong>${masjid.name}</strong>. <a href="/masajid/${masjid.slug}">View Masjid →</a>`);
  res.redirect(`/masajid/${masjid._id}/edit`);
  // Redirect them the masjid and tell them it worked
};

exports.getMasjidBySlug = async (req, res, next) => {
  const masjid = await Masjid.findOne({ slug: req.params.slug }).populate('author reviews');
  if (!masjid) return next();
  res.render('masjid', { masjid, title: masjid.name });
};

exports.getMasajidByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true, $ne: [] };

  const tagsPromise = Masjid.getTagsList();
  const masajidPromise = Masjid.find({ tags: tagQuery });
  const [tags, masajid] = await Promise.all([tagsPromise, masajidPromise]);


  res.render('tag', { tags, title: 'Tags', tag, masajid });
};


exports.searchMasajid = async (req, res) => {
  const masajid = await Masjid
  // first find masajid that match
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // then sort them
  .sort({
    score: { $meta: 'textScore' }
  })
  // limit to only 5 results
  .limit(5);
  res.json(masajid);
};

exports.mapMasajid = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };

  const masajid = await Masjid.find(q).select('slug name description imam_name imam_phone_no location photo').limit(10);
  res.json(masajid);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.qiblaPage = (req, res) => {
 res.render('qibla', { title: 'Qibla' });
};

exports.heartMasjid = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());

  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
    .findByIdAndUpdate(req.user._id,
      { [operator]: { hearts: req.params.id } },
      { new: true }
    );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  const masajid = await Masjid.find({
    _id: { $in: req.user.hearts }
  });
  res.render('masajid', { title: 'My Beloved Masajid', masajid });
};

exports.getTopMasajid = async (req, res) => {
  const masajid = await Masjid.getTopMasajid();
  res.render('topMasajid', { masajid, title:'⭐ Top Masajid!'});
}
