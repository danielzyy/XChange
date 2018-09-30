const GoogleStrategy = require('passport-google-oauth20');
const credentials = require('./credentials.json')
const User = require('../models/User');
const passport = require('passport');

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(u => done(null, u));
});

passport.use(
    new GoogleStrategy({
        callbackURL: '/auth/google/redirect',
        clientID: credentials.google.id,
        clientSecret: credentials.google.secret
    }, (accessToken, refreshToken, profile, done) => {
        User.findOne({ id: profile.id }).then(existingUser => {
            if(existingUser){
                console.log('Existing user has logged in: ' + existingUser);
                done(null, existingUser);
            }else{
                new User({
                    username: profile.displayName,
                    id: profile.id
                }).save().then(newUser => {
                    console.log('New user created: ' + newUser);
                    done(null, newUser);
                })
            }
        })
    })
);