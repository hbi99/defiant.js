/*
 * defiant.js [v1.3.4]
 * http://www.defiantjs.com 
 * Copyright (c) 2013-2015, Hakan Bilgin <hbi@longscript.com> 
 * Licensed under the MIT License
 */

// check if jQuery is present
if (typeof(jQuery) !== 'undefined') {
	(function ( $ ) {
		'use strict';

		$.fn.defiant = function(template, xpath) {
			this.html( Defiant.render(template, xpath) );
			return this;
		};

	}(jQuery));
}
