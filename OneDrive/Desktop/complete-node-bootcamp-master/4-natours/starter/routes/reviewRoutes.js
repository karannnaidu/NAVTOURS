const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
const router = express.Router({
    mergeParams: true
}); //by default each router has access to their specific routes ie tour id does not exist
//POST tour/24d5df/reviews
//get tour/24d5df/reviews
// POST /reviews
router.use(authController.protect);
router.route('/').get(reviewController.getAllReviews)
    .post(authController.protect,
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.createReview);
router.route('/:id').get(reviewController.getReview).patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);
module.exports = router;