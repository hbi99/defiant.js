
if (!Document.selectNodes) {
	Document.prototype.selectNodes = function(XPath, XNode) {
		if (!XNode) XNode = this;
		this.ns = this.createNSResolver(this.documentElement);
		this.qI = this.evaluate(XPath, XNode, this.ns, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		var res = []
			i   = 0,
			il  = res.length;
		for (; i<il; i++) {
			res[i] = this.qI.snapshotItem(i);
		}
		return res;
	};
}

if (!Node.selectNodes) {
	Node.prototype.selectNodes = function(XPath) {
		return this.ownerDocument.selectNodes(XPath, this);
	};
}
