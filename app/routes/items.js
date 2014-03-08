'use strict';

var Item = require('../models/item');
var exec = require('child_process').exec;

exports.index = function(req, res){
  console.log('GET TO ITEMS INDEX');
  res.render('items/index');
};

exports.new = function(req, res){
  console.log('GET TO ITEMS NEW');
  res.render('items/new');
};

exports.show = function(req, res){
  console.log('GET TO ITEMS SHOW');
  Item.findById(req.params.id, function(item){
    res.render('items/show', {item:item});
  });
};

exports.create = function(req, res){
  var item = new Item(req.body);
  item.insert(function(){
    item.mkDir(function(){
      item.addPhoto(req.files.photo.path, req.files.photo.name, function(){
        item.update(function(){
          res.redirect('/items/'+ item._id.toString());
        });
      });
    });
  });
};

exports.destroy = function(req, res){
  Item.findById(req.params.id, function(item){
    if(req.session.userId === item.userId.toString()){
      var cmd = 'rm -rf ' + __dirname + '/../static' + item.photoPath;
      Item.deleteById(req.params.id, function(){
        exec(cmd, function(){
          res.redirect('/users/'+req.session.userId);
        });
      });
    }
  });
};

exports.addOffer = function(req, res){
  Item.findById(req.params.item, function(item){
    item.addOffer(req.params.itemOffer);
    Item.findById(req.params.itemOffer, function(itemOffer){
      itemOffer.toggleOffered();
      res.redirect('/items/' + req.params.item);
    });
  });
};

exports.removeOffer = function(req, res){
  Item.findById(req.params.item, function(item){
    item.removeOffer(req.params.itemOffer);
    Item.findById(req.params.itemOffer, function(itemOffer){
      itemOffer.toggleOffered();
      res.redirect('/items/' + req.params.item);
    });
  });
};

exports.accept = function(req, res){
  Item.findById(req.params.item, function(item){
    Item.findById(req.params.itemOffer, function(itemOffer){
      var itemUserId = item.userId;
      var itemOfferUserId = itemOffer.userId;
      item.userId = itemOfferUserId;
      itemOffer.userId = itemUserId;
      itemOffer.toggleOffered();
      item.update(function(){
        itemOffer.update(function(){
          item.sendAcceptEmail();
          itemOffer.sendAcceptEmail();
          res.redirect('/user/'+req.session.userId);
        });
      });
    });
  });
};

