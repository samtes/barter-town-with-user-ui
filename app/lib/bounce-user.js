'use strict';

var url = require('url');
var _ = require('lodash');

module.exports = function(req, res, next){
  var path = url.parse(req.url).pathname;
  console.log(path);
  var urls = ['/', '/register', '/login','/test','/items'];

  if(_.contains(urls, path)){
    next();
  }else if(path === '/items/new'){
    if(req.session.userId){
      next();
    }else{
      res.redirect('/');
    }
  }else if(_.where(urls, '/items/'+/^[0-9a-fA-F]{24}$/)){
    next();
  }else{
    if(req.session.userId){
      next();
    }else{
      res.redirect('/');
    }
  }
};
