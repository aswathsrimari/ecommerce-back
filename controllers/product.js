const Product = require("../models/product");
const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs')
const {errorHandler} = require("../helpers/dbErrorHandler");




exports.productById = (req,res,next,id)=>{
    Product.findById(id)
        .populate("category")
        .exec((err, product)=>{
        if(err || !product){
            return res.status(400).json({
                error: "Product not found"
            });
        }
        req.product = product
        next();
    });
};

exports.read = (req,res)=>{
    req.product.photo = undefined
    return res.json(req.product)
};




exports.create = (req,res)=>{
    let form = new formidable.IncomingForm(); 
    form.keepExtensions = true  //image type received in kept
    form.parse(req, (err, fields, files)=>{
        if(err){
            return res.status(400).json({
                error: 'Image could not be uploaded'
            });
        }


        //check for all fields
        const {name,description, price, category, quantity, shipping} = fields

        if(!name || !description || !price || !category || !quantity || !shipping){
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        let product = new Product(fields);

        if(files.photo){
            //console.log("FILES PHOTO", files.photo);
            if(files.photo.size>1000000){
                return res.status(400).json({
                    error: "Image should be less than 1mb of size"
                });
            }

            product.photo.data = fs.readFileSync(files.photo.path)
            product.photo.contentType = files.photo.type;
        }

        product.save((err,result)=>{
            if(err){
                console.log(err);
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(result)
        });
    });
};


exports.remove = (req,res)=>{
    let product = req.product
    product.remove((err, deleteProduct)=>{
        if(err){
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json({
            "message": "Product deleted successfully"
        });

    });
}


exports.update = (req,res)=>{
    let form = new formidable.IncomingForm(); 
    form.keepExtensions = true  //image type received in kept
    form.parse(req, (err, fields, files)=>{
        if(err){
            return res.status(400).json({
                error: 'Image could not be uploaded'
            });
        }


        //check for all fields
        const {name,description, price, category, quantity, shipping} = fields

        if(!name || !description || !price || !category || !quantity || !shipping){
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        let product = req.product;
        product = _.extend(product, fields)

        if(files.photo){
            //console.log("FILES PHOTO", files.photo);
            if(files.photo.size>1000000){
                return res.status(400).json({
                    error: "Image should be less than 1mb of size"
                });
            }

            product.photo.data = fs.readFileSync(files.photo.path)
            product.photo.contentType = files.photo.type;
        }

        product.save((err,result)=>{
            if(err){
                console.log(err);
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(result)
        });
    });
};

/**
 * sell/ arrival
 * by sell = /products?sortBy=sold&order=des&limit=4
 * (?- query...by sold and order is ascending with four products on each request)
 * by arrival = /products?sortBy=createdAt&order=des&limit=4
 * if no params are sent,then all products are returned
 */

 exports.list = (req,res)=>{
     let order = req.query.order ? parseInt(req.query.order) : 1
     let sortBy = req.query.sortBy ? req.query.sortBy : "_id"
     let limit = req.query.limit ? parseInt(req.query.limit) :  6;

     Product.find()
        .select("-photo")
        .populate('category')
        .sort([[sortBy, order]])
        .limit(limit)
        .exec((err, products)=>{
            if(err){
                //Console.log(err);
                return res.status(400).json({
                    error: 'Products not found'
                });
            }
            res.json(products);
        });
 };
 /**
  * it will find the products based on the request product category
  * other products of same category will be returned
  */

  exports.listRelated = (req,res)=>{
      let limit = req.query.limit ? parseInt(req.query.limit) : 6;
          //all products expect (ne-not including) this product and show all in that category

      Product.find({_id: {$ne: req.product}, category: req.product.category})
            .limit(limit)
            .populate('category', '_id name') //populate only id and name
            .exec((err, products)=>{
                if(err){
                    //Console.log(err);
                    return res.status(400).json({
                        error: 'Products not found'
                    });
                }
                res.json(products)

            })
  };

  exports.listCategories = (req,res)=>{
      Product.distinct("category", {}, (err, categories)=>{
        if(err){
            return res.status(400).json({
                error: 'Category not found'
            });
        }
        res.json(categories);
      });
  }


  exports.listBySearch = (req, res) => {
    let order = req.body.order ? parseInt(req.body.order) : -1;
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);  //to load more products below
    let findArgs = {};   //category id's and price range populated 
 
    // console.log(order, sortBy, limit, skip, req.body.filters);
    // console.log("findArgs", findArgs);
 
    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }
 
    Product.find(findArgs)
        .select("-photo")  
        .populate("category")
        .sort([[sortBy, order]])
        .skip(skip)
        .limit(limit)
        .exec((err, data) => {
            if (err) {
                return res.status(400).json({
                    error: "Products not found"
                });
            }
            res.json({
                size: data.length,
                data
            });
        });
};

exports.photo = (req,res,next)=>{
    if(req.product.photo.data){
        res.set('Content-Type', req.product.photo.contentType)
        return res.send(req.product.photo.data)
    }
    next();
}


exports.listSearch = (req,res) =>{
    //create query object to hold search value and category value
    const query = {}
    if(req.query.search){
        query.name={$regex: req.query.search, $options: 'i'}
        if(req.query.category && req.query.category!= 'All'){
            query.category = req.query.category
        }
        //find product based on query object with 2 properties= search nd category
        Product.find(query, (err, products) =>{
            if(err){
                return res.status(400).json({
                    error: errorHandler(err)
                })
            }
            res.json(products)
        }).select("-photo");
    }
}