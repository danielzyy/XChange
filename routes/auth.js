const router = require('express').Router();
const passport = require('passport');

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// If the user wants to log in with Google+
router.get('/google', 
    passport.authenticate('google', {
        scope: ['profile']
    })
);

router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    res.redirect('/');
})

module.exports = router;