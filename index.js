
const defiant = {
	init: async () => {
		const puppeteer = require('puppeteer')
		const fs = require('fs')
		const script = fs.readFileSync(__dirname +'/dist/defiant.min.js', 'utf8')

		return new Promise((resolve, reject) => {
			puppeteer
				.launch()
				.then(async browser => {
					const page = await browser.newPage()
					page.on('console', msg => console.log(msg.text()))
					await page.setContent('<script>'+ script +'</script>')

					defiant.browser = browser
					defiant.page = page
					if (page) resolve(page)
					else reject()
				})
		})
	},
	render: async (name, data) => {
		if (!defiant.page) await defiant.init()
		
		data = data || {};
		return defiant.page.evaluate(async (name, data) => {
			var str = defiant.render(name, data);
			str = str.replace(/ (xmlns\:xlink|xmlns:d)=".*?"/ig, '');
			return str;
		}, name, data);
		
	},
	render_xml: async (name, xstr) => {
		if (!defiant.page) await defiant.init()
		
		return defiant.page.evaluate(async (name, xstr) => {
			var that = defiant,
				data = that.xmlFromString(xstr),
				str = that.render_xml(name, data);
			str = str.replace(/ (xmlns\:xlink|xmlns:d)=".*?"/ig, '');
			return str;
		}, name, xstr);
	},
	register_template: async (str) => {
		if (!defiant.page) await defiant.init()
		
		return defiant.page.evaluate(async (str) => {
			var that = defiant;
			that.xsl_template = that.xmlFromString('<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xlink="http://www.w3.org/1999/xlink" '+ that.namespace +'>'+ str.replace(/defiant:(\w+)/g, '$1') +'</xsl:stylesheet>');
		}, str);
	},
	create_snapshot: async (data, callback) => {
		if (!defiant.page) await defiant.init()

		return defiant.page.evaluate(async (data, callback) => {
			return new Promise((resolve, reject) => {
				defiant.createSnapshot(data, function(snapshotId) {
					resolve(snapshotId)
				})
			})
		}, data, callback)
	},
	search: async (data, xpath, persist) => {
		if (!defiant.page) await defiant.init()

		const result = await defiant.page.evaluate(async (data, xpath) => {
			return defiant.search(data, xpath)
		}, data, xpath)

		if (!persist) defiant.browser.close()

		return result
	}
}

module.exports = defiant
