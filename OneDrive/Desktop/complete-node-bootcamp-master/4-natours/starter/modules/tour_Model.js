const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'a tour must have a name'],
    unique: true,
    trim: true,
    maxlength: [40, 'a tour name must have less pr equal to 40 characters'],
    minlength: [
      10,
      'a tour length should have  more than or equal to 10 character'
    ]
    // validate: [validator.isAlpha, 'tour name must only contain charaters']
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'a tour must have  a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, ' a tour must hace a group size']
  },
  difficulty: {
    type: String,
    required: [true, ' a tour must have a difficulty'],
    enum: {
      values: ['easy', 'difficult', 'medium'],
      message: 'difficulty  is either : easy ,medium,difficult'
    }
  },

  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'ratings must be above 1'],
    max: [5, 'ratings should be below 5'],
    set: val => Math.round(val * 10) / 10 // will be run when new value is set
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'a tour must have a price']
  },
  priceDiscount: {
    type: Number,
    validate: {
      //this  only points to  current doc  on new document creation AND NOT ON UPDATE
      validator: function (val) {
        return val < this.price;
      },
      message: 'discount ({VALUE}) price should be below the regular price'
    }
  },
  summary: {
    type: String,
    trim: true
    //required: [true, 'a tour must have a summary']
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'a tour must have a description']
  },
  imageCover: {
    type: String,
    required: [true, ' a tour must have a cover image ']
  },
  images: [String],
  createAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    //GeoJSON geospatial data
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [{
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String,
    day: Number
  }],
  guides: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }]

}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});
//1 ascending order// for performance gain 
//tourSchema.index({ price: 1})
tourSchema.index({
  price: 1,
  ratingsAverage: -1
});
tourSchema.index({
  slug: 1
})
tourSchema.index({
  startLocation: '2dsphere'
})

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
//virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
})
//document middleware runs before .save() and.create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true
  });
  next();
});
/*
tourSchema.pre('save', async function (next) {
  const guidesPromises = this.guides.map(async id => await User.findById(id));

  this.guides = await Promise.all(guidesPromises);
  next();
});*/
// only for save and create mongoose methods
/*tourSchema.pre('save', function(next) {
  console.log('will save document);
  next();
});
tourSchema.post('save', function(doc, next) {
  console.log(doc);
  next();
});*/

//Query middleware
tourSchema.pre(/^find/, function (next) {
  //tourSchema.pre('find', function(next) {
  this.find({
    secretTour: {
      $ne: true
    }
  });
  this.start = Date.now();
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -passwordResetExpires'
  });
  next();
})
tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start} in millisecconds`);
  //console.log(docs);
  next();
});

// Ageregation middleware
/*tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $match: {
      secretTour: {
        $ne: true
      }
    }
  });
  console.log(this.pipeline());
  next();
});*/
const Tour = mongoose.model('Tour', tourSchema);
console.log(Tour);
module.exports = Tour;