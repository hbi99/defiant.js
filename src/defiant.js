
(function(window, module, undefined) {
	'use strict';

	var Defiant = {
		is_ie     : /(msie|trident)/i.test(navigator.userAgent),
		is_safari : /safari/i.test(navigator.userAgent),
		env       : 'production',
		xml_decl  : '<?xml version="1.0" encoding="utf-8"?>',
		namespace : 'xmlns:d="defiant-namespace"',
		tabsize   : 4,
		snapshots : {},
		render_xml: function(template, data) {
			var processor = new XSLTProcessor(),
				span      = document.createElement('span'),
				tmpltXpath = '//xsl:template[@name="'+ template +'"]',
				temp = this.node.selectSingleNode(this.xsl_template, tmpltXpath);

			temp = this.node.selectSingleNode(this.xsl_template, tmpltXpath);
			temp.setAttribute('match', '/');
			processor.importStylesheet(this.xsl_template);
			span.appendChild(processor.transformToFragment(data, document));
			temp.removeAttribute('match');

			return span.innerHTML;
		},
		render: function(template, data) {
			var processor = new XSLTProcessor(),
				span      = document.createElement('span'),
				opt       = {match: '/'},
				tmpltXpath,
				scripts,
				temp,
				sorter;
			// handle arguments
			switch (typeof(template)) {
				case 'object':
					this.extend(opt, template);
					if (!opt.data) opt.data = data;
					break;
				case 'string':
					opt.template = template;
					opt.data = data;
					break;
				default:
					throw 'error';
			}
			opt.data = JSON.toXML(opt.data);
			tmpltXpath = '//xsl:template[@name="'+ opt.template +'"]';

			if (!this.xsl_template) this.gatherTemplates();

			if (opt.sorter) {
				sorter = this.node.selectSingleNode(this.xsl_template, tmpltXpath +'//xsl:for-each//xsl:sort');
				if (sorter) {
					if (opt.sorter.order) sorter.setAttribute('order', opt.sorter.order);
					if (opt.sorter.select) sorter.setAttribute('select', opt.sorter.select);
					sorter.setAttribute('data-type', opt.sorter.type || 'text');
				}
			}

			temp = this.node.selectSingleNode(this.xsl_template, tmpltXpath);
			temp.setAttribute('match', opt.match);
			processor.importStylesheet(this.xsl_template);
			span.appendChild(processor.transformToFragment(opt.data, document));
			temp.removeAttribute('match');

			if (this.is_safari) {
				scripts = span.getElementsByTagName('script');
				for (var i=0, il=scripts.length; i<il; i++) scripts[i].defer = true;
			}
			return span.innerHTML;
		},
		gatherTemplates: function() {
			var scripts = document.getElementsByTagName('script'),
				str     = '',
				i       = 0,
				il      = scripts.length;
			for (; i<il; i++) {
				if (scripts[i].type === 'defiant/xsl-template') str += scripts[i].innerHTML;
			}
			this.xsl_template = this.xmlFromString('<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xlink="http://www.w3.org/1999/xlink" '+ this.namespace +'>'+ str.replace(/defiant:(\w+)/g, '$1') +'</xsl:stylesheet>');
		},
		getSnapshot: function(data, callback) {
			return JSON.toXML(data, callback || true);
		},
		createSnapshot: function(data, callback) {
			var that = this,
				snapshotId = 'snapshot_'+ Date.now();
			JSON.toXML(data, function(snapshot) {
				that.snapshots[snapshotId] = snapshot;
				callback(snapshotId);
			});
		},
		xmlFromString: function(str) {
			var parser,
				doc;
			str = str.replace(/>\s{1,}</g, '><');
			if (str.trim().match(/<\?xml/) === null) {
				str = this.xml_decl + str;
			}
			if ( 'ActiveXObject' in window ) {
				doc = new ActiveXObject('Msxml2.DOMDocument');
				doc.loadXML(str);
				doc.setProperty('SelectionNamespaces', this.namespace);
				if (str.indexOf('xsl:stylesheet') === -1) {
					doc.setProperty('SelectionLanguage', 'XPath');
				}
			} else {
				parser = new DOMParser();
				doc = parser.parseFromString(str, 'text/xml');
			}
			return doc;
		},
		extend: function(src, dest) {
			for (var content in dest) {
				if (!src[content] || typeof(dest[content]) !== 'object') {
					src[content] = dest[content];
				} else {
					this.extend(src[content], dest[content]);
				}
			}
			return src;
		},
		node: {}
	};

	@@include('./x10.js')
	@@include('./string.js')
	@@include('./json.js')
	@@include('./json.toXML.js')
	@@include('./json.search.js')
	@@include('./json.mtrace.js')
	@@include('./node.select.js')
	@@include('./node.serialize.js')
	@@include('./node.toJSON.js')
	@@include('./jquery-plugin.js')

	// Export
	window.Defiant = module.exports = Defiant;

})(
	typeof window !== 'undefined' ? window : {},
	typeof module !== 'undefined' ? module : {}
);

@@include('./ie.polyfill.js')
