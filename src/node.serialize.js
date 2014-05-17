
Defiant.node.prettyPrint = function(node) {
	var root = Defiant,
		tabs = root.tabsize,
		decl = root.xml_decl.toLowerCase(),
		ser,
		xstr;
	if (root.is_ie) {
		xstr = node.xml;
	} else {
		ser  = new XMLSerializer();
		xstr = ser.serializeToString(node);
	}
	if (root.env !== 'development') {
		// if environment is not development, remove defiant related info
		xstr = xstr.replace(/ \w+\:d=".*?"| d\:\w+=".*?"/g, '');
	}
	var str    = xstr.trim().replace(/(>)\s*(<)(\/*)/g, '$1\n$2$3'),
		lines  = str.split('\n'),
		indent = -1,
		i      = 0,
		il     = lines.length,
		start,
		end;
	for (; i<il; i++) {
		if (i === 0 && lines[i].toLowerCase() === decl) continue;
		start = lines[i].match(/<[A-Za-z_\:]+.*?>/g) !== null;
		//start = lines[i].match(/<[^\/]+>/g) !== null;
		end   = lines[i].match(/<\/[\w\:]+>/g) !== null;
		if (lines[i].match(/<.*?\/>/g) !== null) start = end = true;
		if (start) indent++;
		lines[i] = String().fill(indent, '\t') + lines[i];
		if (start && end) indent--;
		if (!start && end) indent--;
	}
	return lines.join('\n').replace(/\t/g, String().fill(tabs, ' '));
};
