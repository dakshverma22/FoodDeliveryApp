require('dotenv').config()
const express = require("express")
const app = express()
const path = require('path')
const ejs = require('ejs')
const expressLayout = require("express-ejs-layouts")
const PORT = process.env.PORT || 31000
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoStore = require('connect-mongo')

//Database connection
const url = 'mongodb://localhost/pizza';
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true, useCreateIndex: true });

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('Database connected....');
}).catch(err => {
    console.log('Connection failed......');
});


//Session config
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: MongoStore.create({ mongoUrl: url }),
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } //24 hours
}))


app.use(flash())


//Assets
app.use(express.static('public'))
app.use(express.json())

//Global middleware
app.use((req, res, next) => {
    res.locals.session = req.session
    next()
})

//set Template engine
app.use(expressLayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')

require('./routes/web')(app)

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})