/* jshint expr:true */

'use strict';

process.env.DBNAME = 'bartertown-test';
var request = require('supertest');
var fs = require('fs');
var exec = require('child_process').exec;
var app = require('../../app/app');
var expect = require('chai').expect;
var User;
var cookie;
var u1;

describe('user', function(){
  before(function(done){
    request(app)
    .get('/')
    .end(function(err, res){
      User = require('../../app/models/user');
      done();
    });
  });

  beforeEach(function(done){
    var testdir = __dirname + '/../../app/static/img/test*';
    var cmd = 'rm ' + testdir;

    exec(cmd, function(){
      var origfile = __dirname + '/../fixtures/testfile.jpg';
      var copyfile = __dirname + '/../fixtures/testfile-copy.jpg';
      fs.createReadStream(origfile).pipe(fs.createWriteStream(copyfile));

      global.nss.db.dropDatabase(function(err, result){
        u1 = new User({name:'Adam Thede', email:'sam@adam.com', password:'1234'});
        u1.hashPassword(function(){
          u1.insert(function(){
            done();
          });
        });
      });
    });
  });

  describe('GET /', function(){
    it('should display the home page', function(done){
      request(app)
      .get('/')
      .expect(200, done);
    });
  });

  describe('POST /register', function(){
    it('should allow a user to register', function(done){
      var filename = __dirname + '/../fixtures/testfile-copy.jpg';
      request(app)
      .post('/register')
      .field('name', 'Adam Thede')
      .field('email', 'iadam@ast.com')
      .field('password', '1235')
      .attach('pic', filename)
      .end(function(err, res){
        expect(res.status).to.equal(302);
        done();
      });
    });

    it('should not allow a duplicate email to register', function(done){
      var filename = __dirname + '/../fixtures/testfile-copy.jpg';
      request(app)
      .post('/register')
      .field('name', 'Adam Thede')
      .field('email', 'sam@adam.com')
      .field('password', '1234')
      .attach('pic', filename)
      .end(function(err, res){
        expect(res.status).to.equal(302);
        done();
      });
    });
  });

  describe('GET /register', function(){
    it('should load the register page', function(done){
      request(app)
      .get('/register')
      .expect(200, done);
    });
  });

  describe('POST /login', function(){
    it('should login registered user', function(done){
      request(app)
      .post('/login')
      .field('email', 'sam@adam.com')
      .field('password', '1234')
      .end(function(err, res){
        expect(res.body.success).to.be.true;
        done();
      });
    });

    it('should not login unregistered user by email', function(done){
      request(app)
      .post('/login')
      .field('email', 'oodam@adam.com')
      .field('password', '1234')
      .end(function(err, res){
        expect(res.body.success).to.be.false;
        done();
      });
    });

    it('should not login user with wrong password', function(done){
      request(app)
      .post('/login')
      .field('email', 'sam@adam.com')
      .field('password', 'kjdhfg')
      .end(function(err, res){
        expect(res.body.success).to.be.false;
        done();
      });
    });
  });

  describe('POST /logout', function(){
    it('should log a user out of the app', function(done){
      request(app)
      .post('/logout')
      .expect(302, done);
    });
  });

  describe('AUTHORIZED', function(){
    beforeEach(function(done){
      request(app)
      .post('/login')
      .field('email', 'sam@adam.com')
      .field('password', '1234')
      .end(function(err, res){
        cookie = res.headers['set-cookie'];
        done();
      });
    });

    describe('GET /users/:id', function(){
      it('should show a user profile page', function(done){
        request(app)
        .get('/users/'+u1._id.toString())
        .set('cookie', cookie)
        .expect(200, done);
      });
    });
  });

  describe('PUT /users/:id', function(){
    it('should show a user profile page', function(done){
      request(app)
      .put('/users/'+u1._id.toString())
      .set('cookie', cookie)
      .field('name', 'Julius')
      .expect(302, done);
    });
  });

  describe('Delete /users/:id', function(){
    it('should delete a user', function(done){
      request(app)
      .del('/users/'+u1._id.toString())
      .set('cookie', cookie)
      .expect(302, done);
    });
  });
});




