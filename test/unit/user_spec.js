/* jshint expr:true */

'use strict';

process.env.DBNAME = 'bartertown-test';
var expect = require('chai').expect;
var User;
var fs = require('fs');
var exec = require('child_process').exec;

describe('User', function(){

  before(function(done){
    var initMongo = require('../../app/lib/init-mongo');
    initMongo.db(function(){
      User = require('../../app/models/user');
      done();
    });
  });

  beforeEach(function(done){
    var testdir = __dirname + '/../../app/static/img/users/test*';
    var cmd = 'rm ' + testdir;

    exec(cmd, function(){
      var origfile = __dirname + '/../fixtures/testfile.jpg';
      var copyfile = __dirname + '/../fixtures/testfile-copy.jpg';
      fs.createReadStream(origfile).pipe(fs.createWriteStream(copyfile));
      global.nss.db.dropDatabase(function(err, result){
        done();
      });
    });
  });

  describe('new', function(){
    it('should create a new User object', function(done){
      var u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
      expect(u1.name).to.equal('Adam Thede');
      expect(u1.email).to.equal('adam@adam.com');
      expect(u1.password).to.equal('1234');
      done();
    });
  });

  describe('#hashPassword', function(){
    it('should hash the password', function(done){
      var u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
      u1.hashPassword(function(){
        expect(u1.password).to.not.equal('1234');
        done();
      });
    });
  });

  describe('#addProfilePic', function(){
    it('should add a pic to the user', function(done){
      var u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
      u1.hashPassword(function(){
        var oldname = __dirname + '/../fixtures/testfile-copy.jpg';
        u1.addPic(oldname, function(){
          expect(u1.pic).to.equal('/img/users/testfile-copy.jpg');
          done();
        });
      });
    });
  });

  describe('#insert', function(){
    it('should add the user to the users db', function(done){
      var u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
      u1.hashPassword(function(){
        var oldname = __dirname + '/../fixtures/testfile-copy.jpg';
        u1.addPic(oldname, function(){
          u1.insert(function(){
            expect(u1._id.toString()).to.have.length(24);
            done();
          });
        });
      });
    });

    it('should not add the user to the users db, because of a duplicate email', function(done){
      var u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
      var u2 = new User({name:'John Thede', email:'adam@adam.com', password:'123'});
      u1.hashPassword(function(){
        var oldname = __dirname + '/../fixtures/testfile-copy.jpg';
        u1.addPic(oldname, function(){
          u1.insert(function(){
            u2.insert(function(){
              expect(u2._id).to.not.be.ok;
              done();
            });
          });
        });
      });
    });
  });

  describe('.findById', function(){
    it('should find a user by id', function(done){
      var u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
      u1.hashPassword(function(){
        var oldname = __dirname + '/../fixtures/testfile-copy.jpg';
        u1.addPic(oldname, function(){
          u1.insert(function(){
            User.findById(u1._id.toString(), function(record){
              expect(record._id).to.deep.equal(u1._id);
              done();
            });
          });
        });
      });
    });
  });

  describe('.findByEmailAndPassword', function(){
    it('should find a user by email', function(done){
      var u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
      var u2 = new User({name: 'Fryman', email:'fryman@fryman.com', password:'1234'});
      u1.hashPassword(function(){
        u2.hashPassword(function(){
          u1.insert(function(){
            u2.insert(function(){
              var email = u1.email;
              var password = '1234';
              User.findByEmailAndPassword(email, password, function(user){
                expect(user.name).to.equal('Adam Thede');
                expect(user.password).to.not.equal('1234');
                done();
              });
            });
          });
        });
      });
    });

    it('should not allow an incorrect email', function(done){
      var u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
      var u2 = new User({name: 'Fryman', email:'fryman@fryman.com', password:'1234'});
      u1.hashPassword(function(){
        u2.hashPassword(function(){
          u1.insert(function(){
            u2.insert(function(){
              var email = 'adam@ast.com';
              var password = '1234';
              User.findByEmailAndPassword(email, password, function(user){
                expect(user).to.be.null;
                done();
              });
            });
          });
        });
      });
    });

    it('should not allow an incorrect password', function(done){
      var u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
      var u2 = new User({name: 'Fryman', email:'fryman@fryman.com', password:'1234'});
      u1.hashPassword(function(){
        u2.hashPassword(function(){
          u1.insert(function(){
            u2.insert(function(){
              var email = 'adam@adam.com';
              var password = '1235';
              User.findByEmailAndPassword(email, password, function(user){
                expect(user).to.be.null;
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('#update', function(){
    it('should edit a user', function(done){
      var u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
      var u2 = new User({name: 'Fryman', email:'fryman@fryman.com', password:'1234'});
      u1.hashPassword(function(){
        u2.hashPassword(function(){
          u1.insert(function(){
            u2.insert(function(){
              u1.name = 'Robert';
              u1.email = 'rjfryman@gmail.com';
              u1.update(function(count){
                expect(count).to.equal(1);
                expect(u1.name).to.equal('Robert');
                expect(u1.email).to.equal('rjfryman@gmail.com');
                done();
              });
            });
          });
        });
      });
    });
  });

  describe('#delete', function(){
    it('should delete a user', function(done){
      var u1 = new User({name:'Adam Thede', email:'adam@adam.com', password:'1234'});
      u1.hashPassword(function(){
        u1.insert(function(){
          var oldname = __dirname + '/../fixtures/testfile-copy.jpg';
          u1.addPic(oldname, function(){
            User.deleteById(u1._id.toString(), function(count){
              expect(count).to.equal(1);
              done();
            });
          });
        });
      });
    });
  });
});
