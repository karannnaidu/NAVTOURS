const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({


    name: {
        type: String,
        required: [true, 'pls tell us your name']
    },
    email: {
        type: String,
        required: [true, 'please  provide us your email '],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'please provide a valid email']

    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'

    },
    password: {
        type: String,
        required: [true, 'please provide  a password'],
        minlength: 8,
        select: false

    },
    passwordConfirm: {
        type: String,
        required: [true, 'please confirm your password'],
        validate: {
            // this only works on  create and save!!!
            validator: function (el) {
                return el === this.password //abc===xyz
            },
            message: "passwords are not the same"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});
/*
userSchema.pre('save', async function (next) {
    /// checks if modified from undefined
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;

    next();

});
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now();
    next();
});*/
userSchema.pre(/^find/, function (next) {
    // this points to the current query
    this.find({
        active: {
            $ne: false
        }
    });
    next();
})
// global methods/ instance methods
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    // format : bcrypt.compare (given string password: hashed password)
    return await bcrypt.compare(candidatePassword, userPassword)
};
userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        //console.log(changedTimeStamp, JWTTimeStamp)
        return JWTTimeStamp > changedTimeStamp
    }
    // false  means password changed
    return false;
}

userSchema.methods.correctPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    //then we have to encrypt the resetToken


    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    //console.log({
    //  resetToken
    //}, this.passwordResetToken);
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;

};

const User = mongoose.model('User', userSchema);
module.exports = User;