
Defiant.node.selectNodes = function(XNode, XPath) {
	if (XNode.evaluate) {
		var ns = XNode.createNSResolver(XNode.documentElement),
			qI = XNode.evaluate(XPath, XNode, ns, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null),
			res = [],
			i   = 0,
			il  = qI.snapshotLength;
		for (; i<il; i++) {
			res.push( qI.snapshotItem(i) );
		}
		return res;
	} else {
		return XNode.selectNodes(XPath);
	}
};
Defiant.node.selectSingleNode = function(XNode, XPath) {
	if (XNode.evaluate) {
		var xI = this.selectNodes(XNode, XPath);
		return (xI.length > 0)? xI[0] : null;
	} else {
		return XNode.selectSingleNode(XPath);
	}
};
