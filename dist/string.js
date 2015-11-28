/*
 * defiant.js [v1.3.4]
 * http://www.defiantjs.com 
 * Copyright (c) 2013-2015, Hakan Bilgin <hbi@longscript.com> 
 * Licensed under the MIT License
 */

// extending STRING
if (!String.prototype.fill) {
	String.prototype.fill = function(i,c) {
		var str = this;
		c = c || ' ';
		for (; str.length<i; str+=c){}
		return str;
	};
}

if (!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^\s+|\s+$/gm, '');
	};
}

if (!String.prototype.xTransform) {
	String.prototype.xTransform = function () {
		var str = this;
		if (this.indexOf('translate(') === -1) {
			str = this.replace(/contains\(([^,]+),([^\\)]+)\)/g, function(c,h,n) {
				var a = 'abcdefghijklmnopqrstuvwxyz',
					q = n.trim().slice(-1);
				return "contains(translate("+ h +", "+ q + a.toUpperCase() + q +", "+ q + a + q +"),"+ n.toLowerCase() +")";
			});
		}
		return str.toString();
	};
}
