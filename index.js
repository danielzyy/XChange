const credentials = require('./config/credentials.json');
const bodyParser = require('body-parser');
const passport = require('passport');
const express = require('express');
const { Exchange, Conversion } = require('./models/Conversions');
const path = require('path');

const PORT = process.env.PORT || 3000;
const app = express();

// Setup views
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


// Middleware
app.all('/', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
require('./config/passport-setup');
app.use(require('cookie-session')({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: credentials.cookies.keys
}))
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    if(!req.user) return next();
    const _render = res.render;
    res.render = function (view, options = {}, cb) {
        options['user'] = req.user;
        _render.call(this, view, options, cb);
    }
    next();
})
app.use('/auth', require('./routes/auth'));
//app.use('/profile', require('./routes/profile'));
app.use(express.static('views'));

// Connect to database
require('mongoose').connect(credentials.mongo.uri, () => {
    console.log('Established connection with MongoDB');
});


// Home route
app.get('/', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With');
    res.render('index');
});

app.all('/getall', (req, res) => {
    Exchange.find({}).then(exchanges => {
        let res_ = {}
        for(let i = 0; i < exchanges.length; i++){
            res_[i] = exchanges[i];
        }
        res.json(res_);
    })
})

app.all('/markers', (req, res) => {
    if(!req.user) return res.send('You must have an account to do that!');
    const { from, to, location } = req.query;

    Exchange.findOne({ location }).then(existing => {
        if(existing){
            console.log('LOCATION EXISTS', from, to);
            new Conversion({
                author: req.user,
                from, to
            }).save().then(conv => {
                existing.rates.push(conv);
                existing.save().then(() => {
                    res.json({ rates: existing.rates, thisRate: conv });
                })
            })
        }else{
            new Exchange({ location }).save().then(ne => {
                new Conversion({
                    author: req.user,
                    from, to
                }).save().then(conv => {
                    ne.rates.push(conv);
                    ne.save().then(() => {
                        res.json({ rates: ne.rates });
                    });
                })
            })
        }
    })
})

// Start up app
app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) =>{
    console.log(err);
})