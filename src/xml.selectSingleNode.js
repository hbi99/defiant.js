
if (!Document.selectSingleNode) {
	Document.prototype.selectSingleNode = function(XPath, XNode) {
		if (!XNode) XNode = this;
		this.xI = this.selectNodes(XPath, XNode);
		return (this.xI.length > 0)? this.xI[0] : null;
	};
}

if (!Node.selectSingleNode) {
	Node.prototype.selectSingleNode = function(XPath) {
		return this.ownerDocument.selectSingleNode(XPath, this);
	};
}
