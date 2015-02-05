
(function(window, undefined) {
	//'use strict';

	var x10 = {
		init: function() {
			return this;
		},
		work_handler: function(event) {
			var args = Array.prototype.slice.call(event.data, 1),
				func = event.data[0],
				ret  = tree[func].apply(tree, args);

			// return process finish
			postMessage([func, ret]);
		},
		setup: function(tree) {
			var url    = window.URL || window.webkitURL,
				script = 'var tree = {'+ this.parse(tree).join(',') +'};',
				blob   = new Blob([script + 'self.addEventListener("message", '+ this.work_handler.toString() +', false);'],
									{type: 'text/javascript'}),
				worker = new Worker(url.createObjectURL(blob));
			
			// thread pipe
			worker.onmessage = function(event) {
				var args = Array.prototype.slice.call(event.data, 1),
					func = event.data[0];
				x10.observer.emit('x10:'+ func, args);
			};

			return worker;
		},
		call_handler: function(func, worker) {
			return function() {
				var args = Array.prototype.slice.call(arguments, 0, -1),
					callback = arguments[arguments.length-1];

				// add method name
				args.unshift(func);

				// listen for 'done'
				x10.observer.on('x10:'+ func, function(event) {
					callback(event.detail[0]);
				});

				// start worker
				worker.postMessage(args);
			};
		},
		compile: function(hash) {
			var worker = this.setup(typeof(hash) === 'function' ? {func: hash} : hash),
				obj    = {},
				fn;
			// create return object
			if (typeof(hash) === 'function') {
				obj.func = this.call_handler('func', worker);
				return obj.func;
			} else {
				for (fn in hash) {
					obj[fn] = this.call_handler(fn, worker);
				}
				return obj;
			}
		},
		parse: function(tree, isArray) {
			var hash = [],
				key,
				val,
				v;

			for (key in tree) {
				v = tree[key];
				// handle null
				if (v === null) {
					hash.push(key +':null');
					continue;
				}
				// handle undefined
				if (v === undefined) {
					hash.push(key +':undefined');
					continue;
				}
				switch (v.constructor) {
					case Date:     val = 'new Date('+ v.valueOf() +')';           break;
					case Object:   val = '{'+ this.parse(v).join(',') +'}';       break;
					case Array:    val = '['+ this.parse(v, true).join(',') +']'; break;
					case String:   val = '"'+ v.replace(/"/g, '\\"') +'"';        break;
					case RegExp:
					case Function: val = v.toString();                            break;
					default:       val = v;
				}
				if (isArray) hash.push(val);
				else hash.push(key +':'+ val);
			}
			return hash;
		},
		// simple event emitter
		observer: (function() {
			var stack = {};

			return {
				on: function(type, fn) {
					if (!stack[type]) {
						stack[type] = [];
					}
					stack[type].unshift(fn);
				},
				off: function(type, fn) {
					if (!stack[type]) return;
					var i = stack[type].indexOf(fn);
					stack[type].splice(i,1);
				},
				emit: function(type, detail) {
					if (!stack[type]) return;
					var event = {
							type         : type,
							detail       : detail,
							isCanceled   : false,
							cancelBubble : function() {
								this.isCanceled = true;
							}
						},
						len = stack[type].length;
					while(len--) {
						if (event.isCanceled) return;
						stack[type][len](event);
					}
				}
			};
		})()
	};

	// publish x10
	window.x10 = x10.init();

})(window);
