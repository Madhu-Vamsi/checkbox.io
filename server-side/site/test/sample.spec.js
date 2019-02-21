describe('sample test', function () {
  let page;

  before (async function () {
    page = await browser.newPage();
    await page.goto('http://checkbox.io/researchers.html');
  });

  after (async function () {
    await page.close();
  })

  it('should have the correct page title', async function () {
    expect(await page.title()).to.eql('checkbox.io');
  });

  it('should have a survey design', async function () {
    const searchValue = await page.$eval('#survey-design', el => el.value);
    expect(searchValue).to.not.be.null;
  });

  it('should have a survey preview', async function () {
    const searchValue = await page.$eval('#survey-preview', el => el.value);
    expect(searchValue).to.not.be.null;
  });

  it('should have a footer', async function () {
    const searchValue = await page.$eval('#footer', el => el.value);
    expect(searchValue).to.not.be.null;
  });

});
