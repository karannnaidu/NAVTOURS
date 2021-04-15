const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new AppError('no document found with that id', 404))
    }


    // await Tour.deleteMany();
    res.status(204).json({
        status: 'success',
        data: null
    });

});
exports.updateOne = Model => catchAsync(async (req, res, next) => {


    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!doc) {
        return next(new AppError('no document  found with that id', 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });

});
exports.createOne = Model => catchAsync(async (req, res, next) => {


    //console.log(req.body);
    // const newTour= new Tour({})

    //  newTour.save()
    const doc = await Model.create(req.body);
    // console.log(newTour);
    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    });



    //  res.send('done');
});
exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id)
    if (popOptions) query = query.populate(popOptions)
    const doc = await query
    //   const doc = await Model.findById(req.params.id).populate('reviews'); // only contains reference then by populating we fill it up with actual data
    if (!doc) {
        return next(new AppError('no document found with that id', 404))
    }
    // Tour.findOne ({ _id :req.parms.id})
    res.status(200).json({
        status: 'success',

        data: {
            data: doc
        }
    });
});
exports.getAll = Model => catchAsync(async (req, res, next) => {

    //building query
    //1a) filtering
    /*const queryObj = {
      ...req.query
    };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
  
    excludedFields.forEach(el => delete queryObj[el]);
    //1b) advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
    console.log(JSON.parse(queryStr));
    //console.log(req.query, queryObj);
    let query = Tour.find(JSON.parse(queryStr));*/

    //2)Sorting
    //console.log(req.query.sort);
    /*if (req.query.sort) {
      const Sortby = req.query.sort.split(',').join(' ');
      console.log(Sortby)
      query = query.sort(Sortby);
    } else {
      query = query.sort('-createdAt');
    }*/
    // 3) field limiting

    /* if (req.query.fields) {
       const fields = req.query.fields.split(',').join(' ');
       query = query.select(fields);
     } else {
       query = query.select('-__v');
     }   */

    // 4) pagination
    /* const page = req.query.page * 1 || 1;
     const limit = req.query.limit * 1|| 1;
     const skip = (page - 1) * limit;
  
     query = query.skip(skip).limit(limit);
     if (req.query.page) {
       const numTours = await Tour.countDocuments;
       if (skip >= numTours) throw new error('this page does not exist');
     }*/

    // excecuting query
    //  console.log(req.requestTime);
    //console.log(req.query);

    //to allow for nested get reviews on tour(hack)
    let filter = {}
    if (req.params.tourId) filter = {
        tour: req.params.tourId
    }
    const features = new APIFeatures(Model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    //console.log(req.params.token)
    // console.log(features.query)
    //const doc = await features.query.explain();
    const doc = await features.query;
    // send response
    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            data: doc
        }
    });

});