/* jshint expr:true */

'use strict';

process.env.DBNAME = 'bartertown-test';
var request = require('supertest');
var fs = require('fs');
var exec = require('child_process').exec;
var app = require('../../app/app');
//var expect = require('chai').expect;
var User, Item;
var u1, u2, i1, cookie;

describe('Item', function(){
  before(function(done){
    request(app)
    .get('/')
    .end(function(err, res){
      User = require('../../app/models/user');
      Item = require('../../app/models/item');
      done();
    });
  });

  beforeEach(function(done){
    var testdir = __dirname + '/../../app/static/img/test*';
    var cmd = 'rm ' + testdir;

    exec(cmd, function(){
      var origfile = __dirname + '/../fixtures/testfile.jpg';
      var copyfile = __dirname + '/../fixtures/testfile-copy.jpg';
      var copyfile1 = __dirname + '/../fixtures/testfile-copy1.jpg';
      var copyfile2 = __dirname + '/../fixtures/testfile-copy2.jpg';
      fs.createReadStream(origfile).pipe(fs.createWriteStream(copyfile));
      fs.createReadStream(origfile).pipe(fs.createWriteStream(copyfile1));
      fs.createReadStream(origfile).pipe(fs.createWriteStream(copyfile2));

      global.nss.db.dropDatabase(function(err, result){
        u1 = new User({name:'Adam Thede', email:'adam@adamssweetemailzzz.com', password:'1234'});
        u2 = new User({name:'Robert Fryman', email:'robert.fryman@gmail.com', password:'1234'});
        u1.hashPassword(function(){
          u2.hashPassword(function(){
            u1.insert(function(){
              u2.insert(function(){
                var oldPath = __dirname + '/../fixtures/testfile-copy.jpg';
                var oldPath1 = __dirname + '/../fixtures/testfile-copy1.jpg';
                i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
                i1.insert(function(){
                  i1.mkDir(function(){
                    i1.addPhoto(oldPath, 'testfile-copy.jpg', function(){
                      i1.addPhoto(oldPath1, 'testfile-copy1.jpg', function(){
                        i1.update(function(){
                          request(app)
                          .post('/login')
                          .field('email', 'adam@adamssweetemailzzz.com')
                          .field('password', '1234')
                          .end(function(err, res){
                            cookie = res.headers['set-cookie'];
                            done();
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  describe('GET /items', function(){
    it('should display the item index', function(done){
      request(app)
      .get('/items')
      .expect(200, done);
    });
  });

  describe('GET /items/new', function(){
    it('should display the new item page', function(done){
      request(app)
      .get('/items/new')
      .set('cookie', cookie)
      .expect(200, done);
    });
  });

  describe('GET /items/:id', function(){
    it('should display the new item page', function(done){
      request(app)
      .get('/items/'+i1._id.toString())
      .expect(200, done);
    });
  });

  describe('POST /items', function(){
    it('should create and add a new item', function(done){
      var oldPath = __dirname + '/../fixtures/testfile-copy2.jpg';
      request(app)
      .post('/items')
      .set('cookie', cookie)
      .field('name', 'My Buick')
      .field('year', '1999')
      .field('description', 'this car rocks')
      .field('cost', '5000')
      .field('tags', 'functional, hip, fun')
      .attach('photo', oldPath)
      .expect(302, done);
    });
  });

  describe('DEL /items', function(){
    it('should delete an item', function(done){
      request(app)
      .del('/items/'+i1._id.toString())
      .set('cookie', cookie)
      .expect(302, done);
    });
  });

  describe('POST /items/offers/:item/:itemOffer', function(){
    it('should add the itemOffer id to the item offers array', function(done){
      var i2 = new Item({name:'bike', year:'2000', description:'red', cost:'500', tags:'excercise, sport', userId:u2._id.toString()});
      i2.insert(function(){
        request(app)
        .post('/items/offers/'+i2._id.toString() +'/'+i1._id.toString())
        .set('cookie', cookie)
        .expect(302, done);
      });
    });
  });

  describe('DELETE /items/offers/:item/:itemOffer', function(){
    it('should delete the itemOffer id from the item offers array', function(done){
      var i2 = new Item({name:'bike', year:'2000', description:'red', cost:'500', tags:'excercise, sport', userId:u2._id.toString()});
      i2.insert(function(){
        request(app)
        .post('/items/offers/'+i2._id.toString() +'/'+i1._id.toString())
        .set('cookie', cookie)
        .end(function(){
          request(app)
          .del('/items/offers/'+i2._id.toString() + '/' + i1._id.toString())
          .set('cookie', cookie)
          .expect(302, done);
        });
      });
    });
  });

  describe('POST /items/accept/:item/:itemOffer', function(){
    it('should accept the trade', function(done){
      var i2 = new Item({name:'bike', year:'2000', description:'red', cost:'500', tags:'excercise, sport', userId:u2._id.toString()});
      i2.insert(function(){
        request(app)
        .post('/items/offers/'+i2._id.toString() +'/'+i1._id.toString())
        .set('cookie', cookie)
        .end(function(){
          request(app)
          .post('/login')
          .field('email', 'robert.fryman@gmail.com')
          .field('password', '1234')
          .end(function(err, res){
            var cookie1 = res.headers['set-cookie'];
            request(app)
            .post('/items/accept/'+i2._id.toString() +'/'+i1._id.toString())
            .set('cookie', cookie1)
            .expect(302, done);
          });
        });
      });
    });
  });
});
