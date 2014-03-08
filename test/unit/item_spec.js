/* jshint expr:true */

'use strict';

process.env.DBNAME = 'bartertown-test';
var expect = require('chai').expect;
var User, Item, u1, u2, u3;
var fs = require('fs');
var exec = require('child_process').exec;
var Mongo = require('mongodb');

describe('Item', function(){

  before(function(done){
    var initMongo = require('../../app/lib/init-mongo');
    initMongo.db(function(){
      User = require('../../app/models/user');
      Item = require('../../app/models/item');
      done();
    });
  });

  beforeEach(function(done){
    var testdir = __dirname + '/../../app/static/img/items/*';
    var cmd = 'rm -rf ' + testdir;

    exec(cmd, function(){
      var origfile = __dirname + '/../fixtures/testfile.jpg';
      var copyfile = __dirname + '/../fixtures/testfile-copy.jpg';
      var copyfile1 = __dirname + '/../fixtures/testfile-copy1.jpg';
      fs.createReadStream(origfile).pipe(fs.createWriteStream(copyfile));
      fs.createReadStream(origfile).pipe(fs.createWriteStream(copyfile1));
      global.nss.db.dropDatabase(function(err, result){
        u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
        u2 = new User({name:'Robert Fryman', email:'robert.fryman@gmail.com', password:'4567'});
        u3 = new User({name:'Nat Webb', email:'nat@nat.com', password:'abcd'});
        u1.hashPassword(function(){
          u2.hashPassword(function(){
            u3.hashPassword(function(){
              u1.insert(function(){
                u2.insert(function(){
                  u3.insert(function(){
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

  describe('new', function(){
    it('should create a new Item object', function(){
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      expect(i1).to.be.instanceof(Item);
      expect(i1.name).to.equal('car');
      expect(i1.year).to.equal(1969);
      expect(i1.description).to.equal('blue');
      expect(i1.cost).to.equal(1000);
      expect(i1.tags).to.deep.equal(['nice']);
      expect(i1.userId).to.deep.equal(u1._id);
      expect(i1.userId).to.be.instanceof(Mongo.ObjectID);
    });
  });

  describe('#insert', function(){
    it('should insert a new item in the db', function(done){
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      i1.insert(function(){
        expect(i1._id.toString()).to.have.length(24);
        done();
      });
    });
  });

  describe('#mkDir', function(){
    it('should make an item directory in the file system', function(done){
      var pathName = '/img/items/';
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      i1.insert(function(){
        var id = i1._id.toString();
        i1.mkDir(function(){
          expect(i1.photoPath).to.equal(pathName + id);
          done();
        });
      });
    });
  });

  describe('#addPhoto', function(){
    it('should add a photo to the item directory and put its path into the photos directory', function(done){
      var oldPath = __dirname + '/../fixtures/testfile-copy.jpg';
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      i1.insert(function(){
        i1.mkDir(function(){
          i1.addPhoto(oldPath, 'itempic.jpg', function(){
            expect(i1.photos).to.have.length(1);
            expect(i1.photos[0]).to.equal('/img/items/'+i1._id.toString()+'/itempic.jpg');
            done();
          });
        });
      });
    });
  });

  describe('#update', function(){
    it('should update an item in the db', function(done){
      var oldPath = __dirname + '/../fixtures/testfile-copy.jpg';
      var oldPath1 = __dirname + '/../fixtures/testfile-copy1.jpg';
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      i1.insert(function(){
        i1.mkDir(function(){
          i1.addPhoto(oldPath, 'testfile-copy.jpg', function(){
            i1.addPhoto(oldPath1, 'testfile-copy1.jpg', function(){
              i1.name = 'My Buick';
              i1.year = 1938;
              i1.cost = 20000;
              i1.update(function(count){
                expect(count).to.equal(1);
                expect(i1.name).to.equal('My Buick');
                expect(i1.year).to.equal(1938);
                expect(i1.cost).to.equal(20000);
                expect(i1.description).to.equal('blue');
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('#addOffer', function(){
    it('should add an item\'s _id to the offers array and change the state of the item receiving the offer', function(done){
      var oldPath = __dirname + '/../fixtures/testfile-copy.jpg';
      var oldPath1 = __dirname + '/../fixtures/testfile-copy1.jpg';
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      var i2 = new Item({name:'couch', year:'1983', description:'brown', cost:'100', tags:'stained, springy', userId:u1._id.toString()});
      i1.insert(function(){
        i1.mkDir(function(){
          i1.addPhoto(oldPath, 'testfile-copy.jpg', function(){
            i2.insert(function(){
              i2.mkDir(function(){
                i2.addPhoto(oldPath1, 'testfile-copy1.jpg', function(){
                  i1.addOffer(i2._id.toString());
                  expect(i1.offers).to.have.length(1);
                  expect(i1.offers[0]).to.deep.equal(i2._id);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  describe('#toggleOffered', function(){
    it('should toggle the offer state on an item', function(done){
      var oldPath = __dirname + '/../fixtures/testfile-copy.jpg';
      var oldPath1 = __dirname + '/../fixtures/testfile-copy1.jpg';
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      var i2 = new Item({name:'couch', year:'1983', description:'brown', cost:'100', tags:'stained, springy', userId:u1._id.toString()});
      i1.insert(function(){
        i1.mkDir(function(){
          i1.addPhoto(oldPath, 'testfile-copy.jpg', function(){
            i2.insert(function(){
              i2.mkDir(function(){
                i2.addPhoto(oldPath1, 'testfile-copy1.jpg', function(){
                  i1.addOffer(i2._id.toString());
                  i2.toggleOffered();
                  expect(i2.offered).to.be.true;
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  describe('.findById', function(){
    it('should find an item by id in the db', function(done){
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      var i2 = new Item({name:'couch', year:'1983', description:'brown', cost:'100', tags:'stained, springy', userId:u1._id.toString()});
      i1.insert(function(){
        i2.insert(function(){
          var id = i2._id.toString();
          Item.findById(id, function(record){
            expect(record._id.toString()).to.equal(id);
            done();
          });
        });
      });
    });
  });

  describe('.deleteById', function(){
    it('should find and delete item by id', function(done){
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      var i2 = new Item({name:'couch', year:'1983', description:'brown', cost:'100', tags:'stained, springy', userId:u1._id.toString()});
      i1.insert(function(){
        i2.insert(function(){
          var id = i2._id.toString();
          Item.deleteById(id, function(count){
            expect(count).to.equal(1);
            done();
          });
        });
      });
    });
  });

  describe('.findAll', function(){
    it('should return all the items', function(done){
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      var i2 = new Item({name:'couch', year:'1983', description:'brown', cost:'100', tags:'stained, springy', userId:u1._id.toString()});
      i1.insert(function(){
        i2.insert(function(){
          Item.findAll(function(records){
            expect(records).to.have.length(2);
            done();
          });
        });
      });
    });
  });

  describe('.findByUserId', function(){
    it('should find an array of items by userId', function(done){
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      var i2 = new Item({name:'couch', year:'1983', description:'brown', cost:'100', tags:'stained, springy', userId:u1._id.toString()});
      var i3 = new Item({name:'box', year:'1912', description:'brown', cost:'1', tags:'stained, useful', userId:u2._id.toString()});
      i1.insert(function(){
        i2.insert(function(){
          i3.insert(function(){
            Item.findByUserId(u1._id.toString(), function(items){
              expect(items.length).to.equal(2);
              expect(items[0]._id.toString()).to.have.length(24);
              done();
            });
          });
        });
      });
    });
  });

  describe('.findByCategory', function(){
    it('should find an array of items by category', function(done){
      var i1 = new Item({name:'car', category:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      var i2 = new Item({name:'couch', category:'car', year:'1983', description:'brown', cost:'100', tags:'stained, springy', userId:u1._id.toString()});
      var i3 = new Item({name:'box', category:'not car', year:'1912', description:'brown', cost:'1', tags:'stained, useful', userId:u2._id.toString()});
      i1.insert(function(){
        i2.insert(function(){
          i3.insert(function(){
            Item.findByCategory(i1.category, function(items){
              expect(items.length).to.equal(2);
              expect(items[0]._id.toString()).to.have.length(24);
              done();
            });
          });
        });
      });
    });
  });

  describe('.findByTags', function(){
    it('should find an array of items by tag', function(done){
      var i1 = new Item({name:'car', category:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      var i2 = new Item({name:'couch', category:'car', year:'1983', description:'brown', cost:'100', tags:'stained, springy', userId:u1._id.toString()});
      var i3 = new Item({name:'box', category:'not car', year:'1912', description:'brown', cost:'1', tags:'stained, useful', userId:u2._id.toString()});
      i1.insert(function(){
        i2.insert(function(){
          i3.insert(function(){
            Item.findByTag(i2.tags[0], function(items){
              expect(items.length).to.equal(2);
              expect(items[0]._id.toString()).to.have.length(24);
              done();
            });
          });
        });
      });
    });
  });

  describe('.removeOffer', function(){
    it('should remove an offer from the offers array', function(done){
      var i1 = new Item({name:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      var i2 = new Item({name:'couch', year:'1983', description:'brown', cost:'100', tags:'stained, springy', userId:u1._id.toString()});
      var i3 = new Item({name:'box', year:'1912', description:'brown', cost:'1', tags:'stained, useful', userId:u2._id.toString()});
      i1.insert(function(){
        i2.insert(function(){
          i3.insert(function(){
            i1.addOffer(i2._id.toString());
            i1.addOffer(i3._id.toString());
            expect(i1.offers.length).to.equal(2);
            expect(i1.offers[0]).to.be.instanceof(Mongo.ObjectID);
            done();
          });
        });
      });
    });
  });

  describe('.deleteAllByUserId', function(){
    it('should delete multiple items', function(done){
      var i1 = new Item({name:'car', category:'car', year:'1969', description:'blue', cost:'1000', tags:'nice', userId:u1._id.toString()});
      var i2 = new Item({name:'couch', category:'car', year:'1983', description:'brown', cost:'100', tags:'stained, springy', userId:u1._id.toString()});
      var i3 = new Item({name:'box', category:'not car', year:'1912', description:'brown', cost:'1', tags:'stained, useful', userId:u2._id.toString()});
      i1.insert(function(){
        i2.insert(function(){
          i3.insert(function(){
            Item.deleteAllByUserId(u1._id.toString(), function(count){
              expect(count).to.equal(2);
              done();
            });
          });
        });
      });
    });
  });
/*
  describe('.find', function(){
    beforeEach(function(done){
      var u1id = u1._id.toString();
      var u2id = u2._id.toString();
      var u3id = u3._id.toString();

      var i1 ={name:'mustang', year:'1969', description:'fast', cost:'1500', tags:'fast,like-new', userId:u1id, category:'car'}
      var i2 ={name:'}
      var i3 ={}
      var i4 ={}
      var i5 ={}
      var i6 ={}
      var i7 ={}
      var i8 ={}
      var i9 ={}
      var ia ={}
      var ib ={}
      var ic ={}
      var id ={}
      var ie ={}
      */
});
