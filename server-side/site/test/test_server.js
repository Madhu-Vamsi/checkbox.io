var mocha= require('mocha');
var chai = require('chai'), chaiHttp = require('chai-http');
chai.use(chaiHttp);
var request = require('supertest');
var server = require('/var/lib/jenkins/workspace/checkboxio_build/server-side/site/server');
const got = require('got');
const { expect } = require('chai');

describe('test server.js', function() {

    it('test GET /', function(done) {
       request('http://localhost:3002')
            .get('/api/study/listing/')
            .expect(200, done);
    });

  it('should have the correct page title', async function () {
	const response = await got('http://localhost:80', {timeout:500})
	expect(response.body).to.include('<div class="navbar">');
	});

});
