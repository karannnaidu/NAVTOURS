const Tour = require('./../modules/tour_Model')
const User = require('./../modules/userModel')
const catchAsync = require('./../utils/catchAsync')
const AppError = require('../utils/appError')

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1)get tour data  from collection  
    const tours = await Tour.find();

    //2)Build template
    //3) render that templpate using tour data from 1)


    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
})
exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({
        slug: req.params.slug
    }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });
    if (!tour) {
        return next(new AppError('there is no tour with that name ', 404))
    }
    res.status(200).render('_tour', {
        title: `${tour.name} Tour`,
        tour

    })
});
exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account '
    })

}
exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: ' your account '
    })
}
exports.updateUserdata = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {


        name: req.body.name,
        email: req.body.email
    }, {
        new: true,
        runValidators: true
    });
    res.status(200).render('account', {
        title: ' your account ',
        user: updatedUser
    })
});