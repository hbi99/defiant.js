
// check if jQuery is present
if (typeof(jQuery) !== 'undefined') {
	(function ( $ ) {

		$.fn.defiant = function(template, xpath) {
			this.html( Defiant.render(template, xpath) );
			return this;
		};

	}(jQuery));
}
