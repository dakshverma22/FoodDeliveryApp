require('dotenv').config()
const express = require("express")
const app = express()
const path = require('path')
const ejs = require('ejs')
const expressLayout = require("express-ejs-layouts")
const PORT = process.env.PORT || 4000
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoStore = require('connect-mongo')
const passport = require('passport')
const Emitter = require('events')

//Database connection
//const url = 'mongodb://localhost/pizza';
mongoose.connect(process.env.MONGO_CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true, useCreateIndex: true });

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('Database connected....');
})/*.catch(err => {
    console.log('Connection failed......');
});*/

//Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter',eventEmitter)

//Session config
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_CONNECTION_URL }),
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24} //24 hours
}))

//Passport config
const passportInit = require('./app/config/passport')
const { addAbortSignal } = require('stream')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())


app.use(flash())

//Assets
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))
app.use(express.json())

//Global middleware
app.use((req, res, next) => {
    res.locals.session = req.session
    res.locals.user = req.user
    next()
})

//set Template engine
app.use(expressLayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')

require('./routes/web')(app)

app.use((req, res) => {
    res.status(404).render('errors/404')
})

const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})


// Socket

const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
      socket.on('join', (orderId) => {
        socket.join(orderId)
      })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})

