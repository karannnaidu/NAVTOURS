const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();
app.set('view engine', 'pug'); //express takes care of common template engines like pug
app.set('views', path.join(__dirname, 'views'));

// serving static files
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));
// 1.middle wares
app.use(helmet()); //  set security  http request

console.log(process.env.NODE_ENV);
// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// limit req from same api
const limiter = rateLimit({
  max: 100, // max 100 req per hour
  windowMs: 60 * 60 * 1000,
  message: 'too many requests from this IP, please try again in an hour!'
});

app.use('/api', limiter);
// body parser , reading data from body to req.body

app.use(
  express.json({
    limit: '10kb'
  })
);
app.use(express.urlencoded({
  extended: true,
  limit: '10kb'
}))
app.use(cookieParser());

// Data Sanitization against SQL Injection
app.use(mongoSanitize());

// Data Sanitization against XXS
app.use(xss());
//prevent prameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

/*app.use((req, res, next) => {
  console.log('hello from the middle ware');
  next();
});*/
// test middle ware
app.use((req, res, next) => {
  req.requestTime == new Date().toISOString();
  console.log(req.cookies);

  next();
});
/*app.get('/', (req, res) => {
  res
    .status(200)
    .json({ message: 'hello from the server side ', app: 'Natours' });
});

app.post('/', (req, res) => {
  res.send('you can post to this end point ');
});/  */

// 2)  route handlers

//3)routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  /*res.status(404).json({
    status: 'fail',
    message: `cant find ${req.originalUrl} on this server!`
  })*/
  /*const err = new Error(`cant find ${req.originalUrl} on this server!`);
  err.status = 'fail';
  err.statusCode = 404;*/
  next(new AppError(`cant find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;