//review//rating/createdAt/ref to tour/ref to user
const mongoose = require('mongoose');
const Tour = require('./tour_Model')
const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'review cannot be empty!']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'review must belong to a user']

    }


}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});
reviewSchema.index({
    tour: 1,
    user: 1
}, {
    unique: true
}); // each combination of tour and user has to be unique
reviewSchema.pre(/^find/, function (next) {
    /*  this.populate({
          path: 'tour',
          select: 'name'
      }).populate({
          path: 'user',
          select: 'name photo'
      })*/
    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next();
})
reviewSchema.statics.calcAverageRatings = async function (tourId) {

    const stats = await this.aggregate([{
        $match: {
            tour: tourId
        }
    }, {
        $group: {
            _id: '$tour', //1st feild of group by is id
            nRating: {
                $sum: 1
            },
            avgRating: {
                $avg: '$rating'
            }
        }
    }]);
    console.log(stats);
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }
}
reviewSchema.post('save', function () {
    // post as the current review isn't yet saved in the database
    //post middleware doesn't get access to next
    // this points to current review
    //  this.constructor is the model that created the docment , so for reviews it is tour
    this.constructor.calcAverageRatings(this.tour); //passing the tourid which is in the reviews
});
//findByIdAndUpdate
//findByIdAndDelete

reviewSchema.pre(/^findOneAnd/, async function (next) {
    // here this is the current query be of findByIdAndUpdate/Delete
    // we cannot use the post bec we won't have access to the query

    const r = await this.findOne();
    console.log(r);
})
reviewSchema.pre(/^findOneAnd/, async function (next) {
    // here this is the current query be of findByIdAndUpdate/Delete
    // we cannot use the post bec we won't have access to the query

    this.r = await this.findOne(); // this.r is uded to send the variable from pre to post  
    console.log(this.r);
    next();
})
reviewSchema.post(/^findOneAnd/, async function () {
    // so here the updated review is updated so now we can call the function
    //  this.r = await this.findOne();  cannot use here// query has already excecuted
    await this.r.constructor.calcAverageRatings(this.r.tour); // sending tour id after 
    //the review model has been updated

})
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;