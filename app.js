const mongoose = require('mongoose');
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const config = require('config');
const pug = require('pug');
const http = require('http');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

global.__basedir = __dirname;

const PORT = config.port || 3000;

console.log("DB Connection string: " + config.database.connectionString)

app.set('port', PORT)

const server = http.createServer(app);

server.listen(PORT);
server.on('error', (err) => console.error('sever init error %O', err))
server.on('listening', () => console.info(`listening on port ${PORT}`));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

mongoose.set('useCreateIndex', true);
mongoose.connect(config.database.connectionString, { useNewUrlParser: true }).then(
  () => {
    console.info("Connected to database!");
  },
  err => { console.error("Database connection failed %O", err) }
)

app.use(session({
    secret: "wassup",
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({ url: config.database.connectionString })
}))


//const mongo_express = require('mongo-express/lib/middleware')
//const mongo_express_config = require('./config/mongo_express_config')
//app.use('/mongo_express', mongo_express(mongo_express_config))


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public'));

app.use('/', require('./routes/root'));

//app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  let err = new Error('Not found');
  err.status = 404;
  next(err);
})

app.use((err, req, res, next) => {
  // set locals, only providing error in development
  if (err.status === 404) {
    // logger.error('Path not found %j %O', req.url, err);
  } else {
    console.error('Top level catch : %O', err);
  }
  next()
});