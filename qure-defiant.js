
module.exports = {
	init: function() {
		let that = this;

		// pause the queue
		this.pause(true);

		const puppeteer = require('puppeteer');
		const fs = require('fs');
		const text = '<script>'+ fs.readFileSync('./node_modules/defiant.js/dist/defiant.min.js', 'utf8') +'</script>';

		puppeteer.launch().then(async browser => {
			that.page = await browser.newPage();
			that.page.on('console', msg => console.log(msg.text()));
			await that.page.setContent(text);
			// resume queue
			that.resume();
		});
	},
	defiant_render: function(name, data) {
		return this.page.evaluate(async (name, data) => {
			var str = Defiant.render(name, data);
			str = str.replace(/ (xmlns\:xlink|xmlns:d)=".*?"/ig, '');
			return str;
		}, name, data);
	},
	register_template: function(str) {
		return this.page.evaluate(async (str) => {
			var that = Defiant;
			that.xsl_template = that.xmlFromString('<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xlink="http://www.w3.org/1999/xlink" '+ that.namespace +'>'+ str.replace(/defiant:(\w+)/g, '$1') +'</xsl:stylesheet>');
		}, str);
	},
	defiant_search: function(data, xpath) {
		return this.page.evaluate(async (data, xpath) => {
			return JSON.search(data, xpath);
		}, data, xpath);
	}
};
