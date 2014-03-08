'use strict';

module.exports = Item;

var _ = require('lodash');
var Mongo = require('mongodb');
var items = global.nss.db.collection('items');
var fs = require('fs');
var User = require('./user');
var request = require('request');

function Item(data){
  this.name = data.name;
  this.year = parseInt(data.year);
  this.description = data.description;
  this.photos = [];
  this.cost = parseInt(data.cost);
  this.tags = data.tags.split(',').map(function(tag){return tag.trim();});
  this.tags = _.compact(this.tags);
  this.offered = false;
  this.userId = Mongo.ObjectID(data.userId);
  this.offers = [];
  this.category = data.category;
}
/*
Item.find = function(query, fn){
  var limit = query.limit || 5;
  var skip = query.page ? (query.page - 1) * limit : 0;
  var filter = {};
  var sort = [];

  filter[query.filterName] = query.filterValue;

  if(query.sort){
    var direction = query.direction ? query.direction * 1 : 1;
    sort.push([query.sort, direction]);
  }

  Item.find(filter, {sort:sort, skip:skip, limit:limit}).toArray(function(err, records){
    fn(records);
  });
};
*/
Item.prototype.insert = function(fn){
  items.insert(this, function(err, record){
    fn(err);
  });
};

Item.prototype.mkDir = function(fn){
  var dirname = this._id.toString();
  var abspath = __dirname + '/../static';
  var relpath = '/img/items/' + dirname;
  fs.mkdirSync(abspath + relpath);
  this.photoPath = relpath;
  fn();
};

Item.prototype.addPhoto = function(oldPath, filename, fn){
  var self = this;
  var abspath = __dirname + '/../static';
  var relpath = '/img/items/'+ this._id.toString() + '/' + filename;

  fs.rename(oldPath, abspath + relpath, function(err){
    self.photos.push(relpath);
    fn();
  });
};

Item.prototype.update = function(fn){
  items.update({_id:this._id}, this, function(err, count){
    fn(count);
  });
};


Item.prototype.toggleOffered = function(){
  if (this.offered === true){
    this.offered = false;
  }else{
    this.offered = true;
  }
};

Item.prototype.addOffer = function(id){
  var offerId = Mongo.ObjectID(id);
  this.offers.push(offerId);
};

Item.findAll = function(fn){
  items.find().toArray(function(err, records){
    fn(records);
  });
};

Item.findById = function(id, fn){
  var _id = Mongo.ObjectID(id);

  items.findOne({_id:_id}, function(err, record){
    fn(_.extend(record, Item.prototype));
  });
};

Item.findByCategory = function(category, fn){
  items.find({category:category}).toArray(function(err, records){
    fn(records);
  });
};

Item.findByUserId = function(userId, fn){
  userId = Mongo.ObjectID(userId);

  items.find({userId:userId}).toArray(function(err, records){
    fn(records);
  });
};

Item.findByTag = function(tag, fn){
  items.find({tags:tag}).toArray(function(err, records){
    fn(records);
  });
};

Item.prototype.removeOffer = function(itemId){
  var id = Mongo.ObjectID(itemId);
  _.remove(this.offers, function(item){
    return item === id;
  });
};

Item.deleteById = function(id, fn){
  var _id = Mongo.ObjectID(id);

  items.remove({_id:_id}, function(err, count){
    fn(count);
  });
};

Item.prototype.sendAcceptEmail = function(fn){
  var self = this;
  User.findById(this.userId.toString(), function(user){
    var key = process.env.MAILGUN;
    var url = 'https://api:' + key + '@api.mailgun.net/v2/sandbox46639.mailgun.org/messages';
    var post = request.post(url, function(err, response, body){
      fn();
    });
    var form = post.form();
    form.append('from', 'robert.fryman@gmail.com');
    form.append('to', user.email);
    form.append('subject', 'You have successfully traded!');
    form.append('text', 'Hello, ' + user.name + ', fire up your pickup, \'cause you\'ve got junk! You have successfully gotten '+self.name+' in return for some of your old junk! Got get that shit!');
  });
};

Item.deleteAllByUserId = function(userId, fn){
  userId = Mongo.ObjectID(userId);
  items.remove({userId:userId}, function(err, count){
    fn(count);
  });
};




