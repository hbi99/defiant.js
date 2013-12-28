
if (!Node.xml) {
	Node.prototype.__defineGetter__('xml',  function() {
		var ser    = new XMLSerializer(),
			str    = ser.serializeToString(this).replace(/(>)\s*(<)(\/*)/g, '$1\n$2$3'),
			lines  = str.split('\n'),
			indent = -1,
			s      = '',
			i      = 0,
			il     = lines.length,
			start,
			end;
		for (; i<il; i++) {
			if (lines[i].toLowerCase() === Defiant.xml_decl.toLowerCase()) continue;
			start = lines[i].match(/<[^\/]+>/g) !== null;
			end   = lines[i].match(/<\/\w+>/g) !== null;
			if (lines[i].match(/<.*?\/>/g) !== null) start = end = true;
			if (start) indent++;
			lines[i] = s.fill(indent, '\t') + lines[i];
			if (start && end) indent--;
			if (!start && end) indent--;
		}
		return lines.join('\n').replace(/\t/g, s.fill(4, ' '));
	});
}

if (!Node.text) {
	Node.prototype.__defineGetter__('text', function() {
		return this.textContent;
	});
	Node.prototype.__defineSetter__('text', function(s) {
		this.textContent = s;
	});
}
