const User = require('./../modules/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];

    }); // loop through an  array 
    return newObj;
}
//accepting array input

exports.updateMe = catchAsync(async (req, res, next) => {
    //1) error if user tries to update password
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError(' this route is not for password updates ,pls use /update my password', 400))
    }
    //2)fileter out unwante field names and  update user document 
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true, // so it returns the newly created object
        runvalidators: true
    });
    // bec we using auth.protect middleware we have acces to req.user

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    })
});
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {
        active: false
    })
    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is not yet defined! pls use sign up instead'
    });
};
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id //user id comes from protecct middleware
    next();
};


exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//updating data which is not the password //dont change passwords using update
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)