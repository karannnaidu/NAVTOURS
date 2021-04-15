// pls note passwords and jwt are not the same , jwt is like a boolean ture statement whic is only issued when
// the creditials are matched , passwords are encrypted  using an encrypting algorithm
const crypto = require('crypto');
const util = require('util'); // for promisify function
const jwt = require('jsonwebtoken');
const User = require('./../modules/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const signToken = id => {
    return jwt.sign({
            id
        },
        process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );
};
const createSendToken = (user, statusCode, res) => {

    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true // cookie cannot be accessed or modified by the brower in any way 

    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });
    createSendToken(newUser, 201, res);

});
exports.login = catchAsync(async (req, res, next) => {
    const email = req.body.email;

    const password = req.body.password; // 1) check if email and password exist// entered password by unknown user
    if (!email || !password) {
        return next(new AppError('please provide the email or password', 400));
    }

    //finds the model by email id as that is unique in this case
    const user = await User.findOne({
        email
    }).select('+password'); // password stored in the database
    // if user does not exist or passwords don't match
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password ', 401));
    }
    //console.log(user); // finding user by  unique email
    //3) if everything is ok send token to client
    createSendToken(user, 201, res);
});

exports.logout = (req, res) => {
    res.cookie('jwt', ' logged out ', {
        expires: new Date(Date.now() + (10 * 1000)),
        http: true
    });
    res.status(200).json({
        status: 'success'
    });

}
exports.protect = catchAsync(async (req, res, next) => {
    let token;
    //1)get the token from the user and check if it exists
    // checks if authorization exists and checks if it starts with Bearer
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    // if token does not exist(undefined)
    if (!token) {
        return next(
            new AppError(' you are not logged in ! pls login to get access', 401)
        );
    }
    //console.log(token)
    //2) verification token
    const decoded = await util.promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
    );
    //console.log(decoded.id)
    //3)check if user still exists
    const freshUser = await User.findById(decoded.id);
    //console.log(freshUser)

    if (!freshUser) {
        // for some reason i'm getting an error here  , its taking default value of app.error .
        return next(
            new AppError(' the user belonging to this token does not exist ', 401)
        );
    }

    //4)check if user changed password after the  token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('user recently changed his password', 401));
    }
    req.user = freshUser; // to send data to next middleware
    res.locals.user = freshUser
    next(); // goes to the next route ,means grants access to the next route
});

exports.restrictTo = (...roles) => {
    // accepts arrary input
    return (req, res, next) => {
        // roles is an array { 'admin','lead-guide'}. role='user' then user does not have permission
        //  console.log(roles)
        // console.log(req.user.role)
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('you do not have permission  to perform this action '),
                403
            );
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {

    // 1) get user based on posted email
    const user = await User.findOne({
        email: req.body.email
    });
    if (!user) {
        return next(new AppError('there is no user with this email'), 404);
    }

    //2) genrate random token
    const resetToken = user.correctPasswordResetToken();
    await user.save({
        validateBeforeSave: false
    });

    // 3) send the token as an email ( req.protocol is either for htttp or https)(
    //  console.log(req.protocol);
    //console.log(req.get('host'));
    //console.log(resetToken)
    console.log(user.email)
    console.log
    const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
    //console.log(resetURL)
    const message = `forgot password? submit a patch request with your new password and passwordConfirm to :${resetURL}.\n  if you didn't forget your password pls ignore this email`;

    try {
        await sendEmail({
            email: user.email,
            subject: ' your password reset token (valid for 10 min)',
            message
        });
        res.status(200).json({
            status: 'success',
            message: 'token sent to email'
        });
    } catch (err) {
        console.log(passwordResetExpires);
        console.log(passwordResetExpires);
        (user.passwordResetToken = undefined),

        (user.passwordResetExpires = undefined);
        await user.save({
            validateBeforeSave: false
        });
        return next(
            new AppError('there was an error sending an email . try again later !'),
            500
        );
    }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
    //1)get user based on the  token 
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {
            $gte: Date.now()
        }
    });
    //2) set new passowrd if token has not expired and user still exists, update password
    if (!user) {
        return next(new AppError('token is invalid or as expired', 400))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //3) update changed password at propety for user
    //4)log the user in ,send jwt
    createSendToken(user, 200, res);

});
exports.updatePassword = catchAsync(async (req, res, next) => {
    //1) get the user from the collection
    const user = await User.findById(req.user.id).select('+password'); // password in database ,use user to access
    //2) verification token
    if (!await user.correctPassword(req.body.passwordCurrent, user.password)) {
        return next(new AppError('your current password is wrong'), 401);
    }

    //3)updATE THE PASSWORD &check if user still exists

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save(); // the validation on save will check if password confirm and password are equal 


    //4) login and send the token 
    /* const token = signToken(user._id);
     res.status(200).json({
         status: 'success',
         token
     });*/
    createSendToken(user, 200, res);
});
// only for rendered pages no errors
exports.isLoggedIn = async (req, res, next) => {

    if (req.cookies.jwt) {
        //1)verifies the token

        try {


            const decoded = await util.promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );


            //2)check if the  user still exists
            const currentUser = await User.findById(decoded.id);
            //console.log(currentUse)

            if (!currentUser) {

                return next();
            }

            //43check if user changed password after the  token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }
            // there is a logged in user
            res.locals.user = currentUser // each pug template will have access to res.locals

            return next();
        } catch (err) {
            return next()
        }
    }
    next();
};