const mongoose = require('mongoose');

const dotenv = require('dotenv');

process.on('unhandledException', err => {
  console.log(err.name, err.message);
  console.log('unhandled Rejection : Shuttting Down');
  process.exit(1);
});
dotenv.config({
  path: './config.env'
});
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
//mongoose.connect(process.env.DATABASE_LOCAL, {
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB CONNECTION SUCCESSFUL!'));
/*const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'a tour must have a name'],
    unique: true
  },

  rating: {
    type: Number,
    default: 4.5
  },
  price: {
    type: Number,
    required: [true, 'a tour must have a price']
  }
});/*/
//const Tour = mongoose.model('Tour', tourSchema);

/*const testTour = new Tour({
  name: 'the park camper',

  price: 997
});/*/

/*testTour
  .save()
  .then(doc => {
    console.log(doc);
  })
  .catch(err => {
    console.log('error:', err);
  });/*/
//console.log(con.connections);
const app = require('./app.js');

//console.log(process.env)
//4) start server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('unhandled Rejection : Shuttting Down');
  server.close(() => {
    process.exit(1);
  });
});