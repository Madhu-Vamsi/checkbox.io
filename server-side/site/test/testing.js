const { expect } = require('chai');
const got = require('got');

describe('webpage rendring test', function () {

  it('should have the correct navigation bar', async function () {
	const response = await got('http://localhost:80', {timeout:500})
	expect(response.body).to.include('<div class="navbar">');
  });

});
