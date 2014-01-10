
if (!Document.selectNodes) {
	Document.prototype.selectNodes = function(XPath, XNode) {
		if (!XNode) XNode = this;
		this.ns = this.createNSResolver(this.documentElement);
		this.qI = this.evaluate(XPath, XNode, this.ns, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var res = [],
			i   = 0,
			il  = this.qI.snapshotLength;
		for (; i<il; i++) {
			res.push( this.qI.snapshotItem(i) );
		}
		return res;
	};
}

if (!Document.selectSingleNode) {
	Document.prototype.selectSingleNode = function(XPath, XNode) {
		if (!XNode) XNode = this;
		this.xI = this.selectNodes(XPath, XNode);
		return (this.xI.length > 0)? this.xI[0] : null;
	};
}

if (!Node.selectNodes) {
	Node.prototype.selectNodes = function(XPath) {
		return this.ownerDocument.selectNodes(XPath, this);
	};
}
if (!Node.selectSingleNode) {
	Node.prototype.selectSingleNode = function(XPath) {
		return this.ownerDocument.selectSingleNode(XPath, this);
	};
}
