const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const masjidSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'SubhanaLlah! Please enter a masjid name!'
  },
  imam_name: {
    type: String,
    trim: true,
    required: 'SubhanaLlah! Please enter the name of the masjid imam!'
  },
  imam_phone_no: {
    type: Number,
    required: 'SubhanaLlah! You must supply the phone number of the masjid imam!'
  },
  sec_phone_no: {
    type: Number,
    required: 'SubhanaLlah! You must supply the phone number of the masjid secretary!'
  },
  population: {
    type: Number,
    required: 'SubhanaLlah! You must supply the average population size of the masjid!'
  },
  language: {
    type: String,
    trim: true,
    required: 'SubhanaLlah! Please enter the language of service of the masjid!'
  },
  bank: {
    type: String,
    trim: true,
  },
  acctname: {
    type: String,
    trim: true,
  },
  acctno: {
    type: Number,
  },
  madrasah_name: {
    type: String,
    trim: true,
  },
  madrasah_phone_no: {
    type: Number,
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'SubhanaLlah! You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'SubhanaLlah! You must supply an address!'
    },
    city: {
      type: String,
      required: 'SubhanaLlah! You must supply a city!'
    },
    state: {
      type: String,
      required: 'SubhanaLlah! You must supply a state!'
    },
    country: {
      type: String,
      required: 'SubhanaLlah! You must supply a country!'
    }

  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'SubhanaLlah! You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Define our indexes
masjidSchema.index({
  name: 'text',
  description: 'text'
});

masjidSchema.index({ location: '2dsphere' });

masjidSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other masjids that have a slug of wes, wes-1, wes-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const masjidsWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (masjidsWithSlug.length) {
    this.slug = `${this.slug}-${masjidsWithSlug.length + 1}`;
  }
  next();
  // TODO make more resiliant so slugs are unique
});

masjidSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

masjidSchema.statics.getTopMasajid = function() {
  return this.aggregate([
    // Lookup Masajid and populate their reviews
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'masjid', as: 'reviews' }},
    // filter for only items that have 2 or more reviews
    { $match: { 'reviews.1': { $exists: true } } },
    // Add the average reviews field
    { $project: {
      photo: '$$ROOT.photo',
      name: '$$ROOT.name',
      reviews: '$$ROOT.reviews',
      slug: '$$ROOT.slug',
      averageRating: { $avg: '$reviews.rating' }
    } },
    // sort it by our new field, highest reviews first
    { $sort: { averageRating: -1 }},
    // limit to at most 10
    { $limit: 10 }
  ]);
}

// find reviews where the masjids _id property === reviews masjid property
masjidSchema.virtual('reviews', {
  ref: 'Review', // what model to link?
  localField: '_id', // which field on the masjid?
  foreignField: 'masjid' // which field on the review?
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

masjidSchema.pre('find', autopopulate);
masjidSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Masjid', masjidSchema);
