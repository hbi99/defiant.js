/*
 * defiant.js [v2.2.8]
 * http://www.defiantjs.com
 * Copyright (c) 2013-2023 Hakan Bilgin <hbi@longscript.com>
 * License GNU AGPLv3
 */
((window, module) => {
  const defiant = {
    is_ie: /(msie|trident)/i.test(navigator.userAgent),
    is_safari: /safari/i.test(navigator.userAgent),
    env: 'production',
    xml_decl: '<?xml version="1.0" encoding="utf-8"?>',
    namespace: 'xmlns:d="defiant-namespace"',
    tabsize: 4,
    snapshots: {},
    renderXml: function (template, data) {
      let processor = new window.XSLTProcessor(),
        span = document.createElement('span'),
        tmpltXpath = '//xsl:template[@name="' + template + '"]',
        temp = this.node.selectSingleNode(this.xsl_template, tmpltXpath);

      temp = this.node.selectSingleNode(this.xsl_template, tmpltXpath);
      temp.setAttribute('match', '/');
      processor.importStylesheet(this.xsl_template);
      span.appendChild(processor.transformToFragment(data, document));
      temp.removeAttribute('match');

      return span.innerHTML;
    },
    render: function (template, data) {
      let processor = new window.XSLTProcessor(),
        span = document.createElement('span'),
        opt = { match: '/' },
        tmpltXpath,
        scripts,
        temp,
        sorter;
      // handle arguments
      switch (typeof template) {
        case 'object':
          this.extend(opt, template);
          if (!opt.data) opt.data = data;
          break;
        case 'string':
          opt.template = template;
          opt.data = data;
          break;
        default:
          throw 'error';
      }
      opt.data = opt.data.nodeType ? opt.data : defiant.json.toXML(opt.data);
      tmpltXpath = '//xsl:template[@name="' + opt.template + '"]';

      if (!this.xsl_template) this.gatherTemplates();

      if (opt.sorter) {
        sorter = this.node.selectSingleNode(
          this.xsl_template,
          tmpltXpath + '//xsl:for-each//xsl:sort'
        );
        if (sorter) {
          if (opt.sorter.order) sorter.setAttribute('order', opt.sorter.order);
          if (opt.sorter.select)
            sorter.setAttribute('select', opt.sorter.select);
          sorter.setAttribute('data-type', opt.sorter.type || 'text');
        }
      }

      temp = this.node.selectSingleNode(this.xsl_template, tmpltXpath);
      temp.setAttribute('match', opt.match);
      processor.importStylesheet(this.xsl_template);
      span.appendChild(processor.transformToFragment(opt.data, document));
      temp.removeAttribute('match');

      if (this.is_safari) {
        scripts = span.getElementsByTagName('script');
        for (let i = 0, il = scripts.length; i < il; i++)
          scripts[i].defer = true;
      }
      return span.innerHTML;
    },
    gatherTemplates: function () {
      let scripts = document.getElementsByTagName('script'),
        str = '',
        i = 0,
        il = scripts.length;
      for (; i < il; i++) {
        if (scripts[i].type === 'defiant/xsl-template')
          str += scripts[i].innerHTML;
      }
      this.xsl_template = this.xmlFromString(
        '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
          this.namespace +
          '>' +
          str.replace(/defiant:(\w+)/g, '$1') +
          '</xsl:stylesheet>'
      );
    },
    registerTemplate: function (str) {
      this.xsl_template = this.xmlFromString(
        '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
          this.namespace +
          '>' +
          str.replace(/defiant:(\w+)/g, '$1') +
          '</xsl:stylesheet>'
      );
    },
    getSnapshot: function (data, callback) {
      return this.json.toXML(data, callback || true);
    },
    createSnapshot: function (data, callback) {
      const snapshotId = 'snapshot_' + Date.now();
      this.json.toXML(data, snapshot => {
        this.snapshots[snapshotId] = snapshot;
        callback(snapshotId);
      });
    },
    getFacets: function (data, facets) {
      let xml_org =
          data.constructor === String && data.slice(0, 9) === 'snapshot_'
            ? this.snapshots[data].doc
            : defiant.json.toXML(data),
        xml_copy = xml_org.cloneNode(true),
        out = {},
        oCommon = {},
        weight = 0,
        len,
        batch = 50,
        heaviest,
        heaviest_children,
        heaviest_copy,
        common,
        key,
        getHeaviest = leaf => {
          const len = leaf.childNodes.length;
          switch (leaf.nodeType) {
            case 1:
              if (len >= weight) {
                weight = len;
                heaviest = leaf;
              }
            case 9:
              leaf.childNodes.map(item => getHeaviest(item));
              break;
          }
        };
      // finds out heaviest node
      getHeaviest(xml_org);

      heaviest.childNodes.map(item => {
        if (!oCommon[item.nodeName]) oCommon[item.nodeName] = 1;
        oCommon[item.nodeName]++;
      });

      weight = 0;
      for (key in oCommon) {
        if (weight <= oCommon[key]) {
          weight = oCommon[key];
          common = key;
        }
      }

      // create facet template
      this.createFacetTemplate(facets);

      // empty clone heaviest children
      heaviest_copy = defiant.node.selectSingleNode(
        xml_copy,
        '//*[@d:mi="' + heaviest.getAttribute('d:mi') + '"]'
      );
      defiant.node
        .selectNodes(
          xml_copy,
          '//*[@d:mi="' + heaviest.getAttribute('d:mi') + '"]/' + common
        )
        .map(node => node.parentNode.removeChild(node));

      heaviest_children = defiant.node.selectNodes(
        xml_org,
        '//*[@d:mi="' + heaviest.getAttribute('d:mi') + '"]/' + common
      );
      len = heaviest_children.length - 1;

      heaviest_children.map((node, index) => {
        heaviest_copy.appendChild(node.cloneNode(true));
        if (index % batch === batch - 1 || index === len) {
          const pOutput = defiant
              .render('facets', xml_copy)
              .replace(/\n|\t/g, '')
              .replace(/"": 0,?/g, '')
              .replace(/,\}/g, '}'),
            partial = JSON.parse(pOutput);
          out = defiant.concatFacet(partial, out);
          defiant.node
            .selectNodes(
              xml_copy,
              '//*[@d:mi="' + heaviest.getAttribute('d:mi') + '"]/' + common
            )
            .map(node => node.parentNode.removeChild(node));
        }
      });

      return out;
    },
    createFacetTemplate: function (facets) {
      let xsl_template,
        xsl_keys = [],
        xsl_facets = [],
        key;
      for (key in facets) {
        xsl_keys.push(
          '<xsl:key name="' +
            key +
            'Key" match="' +
            facets[key].group +
            '" use="' +
            facets[key].key +
            '" />'
        );
        xsl_facets.push(
          '"' +
            key +
            '": {<xsl:for-each select="//' +
            facets[key].group +
            "[@d:mi][count(. | key('" +
            key +
            "Key', " +
            facets[key].key +
            ')[1]) = 1]">' +
            '"<xsl:value-of select="' +
            facets[key].key +
            '" />": <xsl:value-of select="count(//' +
            facets[key].group +
            '[' +
            facets[key].key +
            ' = current()/' +
            facets[key].key +
            '])" />' +
            '<xsl:if test="position() != last()">,</xsl:if></xsl:for-each>}'.replace(
              /\n|\t/g,
              ''
            )
        );
      }
      xsl_template =
        xsl_keys.join('') +
        '<xsl:template name="facets">{' +
        xsl_facets.join(',') +
        '}</xsl:template>';

      this.registerTemplate(xsl_template);
    },
    xmlFromString: function (str) {
      let parser, doc;
      str = str.replace(/>\s{1,}</g, '><');
      if (str.trim().match(/<\?xml/) === null) {
        str = this.xml_decl + str;
      }
      if ('ActiveXObject' in window) {
        doc = new ActiveXObject('Msxml2.DOMDocument');
        doc.loadXML(str);
        doc.setProperty('SelectionNamespaces', this.namespace);
        if (str.indexOf('xsl:stylesheet') === -1) {
          doc.setProperty('SelectionLanguage', 'XPath');
        }
      } else {
        parser = new DOMParser();
        doc = parser.parseFromString(str, 'text/xml');
      }
      return doc;
    },
    concatFacet: function (src, dest) {
      for (const content in dest) {
        if (!src[content] || typeof dest[content] !== 'object') {
          src[content] = (src[content] || 0) + dest[content];
        } else {
          this.concatFacet(src[content], dest[content]);
        }
      }
      return src;
    },
    extend: function (src, dest) {
      for (const content in dest) {
        if (!src[content] || typeof dest[content] !== 'object') {
          src[content] = dest[content];
        } else {
          this.extend(src[content], dest[content]);
        }
      }
      return src;
    },
    node: {
      selectNodes: (XNode, XPath) => {
        if (XNode.evaluate) {
          let ns = XNode.createNSResolver(XNode.documentElement),
            qI = XNode.evaluate(
              XPath,
              XNode,
              ns,
              XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
              null
            ),
            res = [],
            i = 0,
            il = qI.snapshotLength;
          for (; i < il; i++) {
            res.push(qI.snapshotItem(i));
          }
          return res;
        } else {
          return XNode.selectNodes(XPath);
        }
      },
      selectSingleNode: function (XNode, XPath) {
        if (XNode.evaluate) {
          const xI = this.selectNodes(XNode, XPath);
          return xI.length > 0 ? xI[0] : null;
        } else {
          return XNode.selectSingleNode(XPath);
        }
      },
      prettyPrint: node => {
        let root = defiant,
          tabs = root.tabsize,
          decl = root.xml_decl.toLowerCase(),
          ser,
          xstr;
        if (root.is_ie) {
          xstr = node.xml;
        } else {
          ser = new XMLSerializer();
          xstr = ser.serializeToString(node);
        }
        if (root.env !== 'development') {
          // if environment is not development, remove defiant related info
          xstr = xstr.replace(/ \w+\:d=".*?"| d\:\w+=".*?"/g, '');
        }
        let str = xstr.trim().replace(/(>)\s*(<)(\/*)/g, '$1\n$2$3'),
          lines = str.split('\n'),
          indent = -1,
          i = 0,
          il = lines.length,
          start,
          end;
        for (; i < il; i++) {
          if (i === 0 && lines[i].toLowerCase() === decl) continue;
          start = lines[i].match(/<[A-Za-z_\:]+.*?>/g) !== null;
          //start = lines[i].match(/<[^\/]+>/g) !== null;
          end = lines[i].match(/<\/[\w\:]+>/g) !== null;
          if (lines[i].match(/<.*?\/>/g) !== null) start = end = true;
          if (start) indent++;
          lines[i] = String().fill(indent, '\t') + lines[i];
          if (start && end) indent--;
          if (!start && end) indent--;
        }
        return lines.join('\n').replace(/\t/g, String().fill(tabs, ' '));
      },
      toJSON: (xnode, stringify) => {
        let interpret = leaf => {
            let obj = {},
              win = window,
              attr,
              type,
              item,
              cname,
              cConstr,
              cval,
              text,
              i,
              il,
              a;
            switch (leaf.nodeType) {
              case 1:
                cConstr = leaf.getAttribute('d:constr');
                if (cConstr === 'Array') obj = [];
                else if (cConstr === 'String' && leaf.textContent === '')
                  obj = '';

                attr = leaf.attributes;
                i = 0;
                il = attr.length;
                for (; i < il; i++) {
                  a = attr.item(i);
                  if (a.nodeName.match(/\:d|d\:/g) !== null) continue;

                  cConstr = leaf.getAttribute('d:' + a.nodeName);
                  if (cConstr && cConstr !== 'undefined') {
                    if (a.nodeValue === 'null') cval = null;
                    else
                      cval = win[cConstr](
                        a.nodeValue === 'false' ? '' : a.nodeValue
                      );
                  } else {
                    cval = a.nodeValue;
                  }
                  obj['@' + a.nodeName] = cval;
                }
                break;
              case 3:
                type = leaf.parentNode.getAttribute('d:type');
                cval = type
                  ? win[type](leaf.nodeValue === 'false' ? '' : leaf.nodeValue)
                  : leaf.nodeValue;
                obj = cval;
                break;
            }
            if (leaf.hasChildNodes()) {
              i = 0;
              il = leaf.childNodes.length;
              for (; i < il; i++) {
                item = leaf.childNodes.item(i);
                cname = item.nodeName;
                attr = leaf.attributes;

                if (cname === 'd:name') {
                  cname = item.getAttribute('d:name');
                }
                if (cname === '#text') {
                  cConstr = leaf.getAttribute('d:constr');
                  if (cConstr === 'undefined') cConstr = undefined;
                  text = item.textContent || item.text;
                  cval = cConstr === 'Boolean' && text === 'false' ? '' : text;

                  if (!cConstr && !attr.length) obj = cval;
                  else if (cConstr && il === 1) {
                    obj = win[cConstr](cval);
                  } else if (!leaf.hasChildNodes()) {
                    obj[cname] = cConstr ? win[cConstr](cval) : cval;
                  } else {
                    if (attr.length < 3)
                      obj = cConstr ? win[cConstr](cval) : cval;
                    else obj[cname] = cConstr ? win[cConstr](cval) : cval;
                  }
                } else {
                  if (item.getAttribute('d:constr') === 'null') {
                    if (obj[cname] && obj[cname].push) obj[cname].push(null);
                    else if (item.getAttribute('d:type') === 'ArrayItem')
                      obj[cname] = [obj[cname]];
                    else obj[cname] = null;
                    continue;
                  }
                  if (obj[cname]) {
                    if (obj[cname].push) obj[cname].push(interpret(item));
                    else obj[cname] = [obj[cname], interpret(item)];
                    continue;
                  }
                  cConstr = item.getAttribute('d:constr');
                  switch (cConstr) {
                    case 'null':
                      if (obj.push) obj.push(null);
                      else obj[cname] = null;
                      break;
                    case 'Array':
                      if (
                        item.parentNode.firstChild === item &&
                        cConstr === 'Array' &&
                        cname !== 'd:item'
                      ) {
                        if (cname === 'd:item' || cConstr === 'Array') {
                          cval = interpret(item);
                          obj[cname] = cval.length ? [cval] : cval;
                        } else {
                          obj[cname] = interpret(item);
                        }
                      } else if (obj.push) obj.push(interpret(item));
                      else obj[cname] = interpret(item);
                      break;
                    case 'String':
                    case 'Number':
                    case 'Boolean':
                      text = item.textContent || item.text;
                      cval =
                        cConstr === 'Boolean' && text === 'false' ? '' : text;

                      if (obj.push) obj.push(win[cConstr](cval));
                      else obj[cname] = interpret(item);
                      break;
                    default:
                      if (obj.push) obj.push(interpret(item));
                      else obj[cname] = interpret(item);
                  }
                }
              }
            }
            if (
              leaf.nodeType === 1 &&
              leaf.getAttribute('d:type') === 'ArrayItem'
            ) {
              obj = [obj];
            }
            return obj;
          },
          node = xnode.nodeType === 9 ? xnode.documentElement : xnode,
          ret = interpret(node),
          rn = ret[node.nodeName];

        // exclude root, if "this" is root node
        if (
          node === node.ownerDocument.documentElement &&
          rn &&
          rn.constructor === Array
        ) {
          ret = rn;
        }
        if (stringify && stringify.toString() === 'true') stringify = '\t';
        return stringify ? JSON.stringify(ret, null, stringify) : ret;
      },
    },
    json: {
      interpreter: {
        map: [],
        rx_validate_name: /^(?!xml)[a-z_][\w\d.:]*$/i,
        rx_node: /<(.+?)( .*?)>/,
        rx_constructor: /<(.+?)( d:contr=".*?")>/,
        rx_namespace: / xmlns\:d="defiant\-namespace"/,
        rx_data: /(<.+?>)(.*?)(<\/d:data>)/i,
        rx_function: /function (\w+)/i,
        namespace: 'xmlns:d="defiant-namespace"',
        to_xml_str: function (tree) {
          return {
            str: this.hash_to_xml(null, tree),
            map: this.map,
          };
        },
        hash_to_xml: function (name, tree, array_child) {
          let is_array = tree.constructor === Array,
            elem = [],
            attr = [],
            key,
            val,
            val_is_array,
            type,
            is_attr,
            cname,
            constr,
            cnName,
            i,
            il,
            fn = (key, tree) => {
              val = tree[key];
              if (val === null || val === undefined || val.toString() === 'NaN')
                val = null;

              is_attr = key.slice(0, 1) === '@';
              cname = array_child ? name : key;
              if (cname == +cname && tree.constructor !== Object)
                cname = 'd:item';
              if (val === null) {
                constr = null;
                cnName = false;
              } else {
                constr = val.constructor;
                cnName = constr.toString().match(this.rx_function)[1];
              }

              if (is_attr) {
                attr.push(cname.slice(1) + '="' + this.escape_xml(val) + '"');
                if (cnName !== 'String')
                  attr.push('d:' + cname.slice(1) + '="' + cnName + '"');
              } else if (val === null) {
                elem.push(this.scalar_to_xml(cname, val));
              } else {
                switch (constr) {
                  case Function:
                    // if constructor is function, then it's not a JSON structure
                    throw 'JSON data should not contain functions. Please check your structure.';
                  /* falls through */
                  case Object:
                    elem.push(this.hash_to_xml(cname, val));
                    break;
                  case Array:
                    if (key === cname) {
                      val_is_array = val.constructor === Array;
                      if (val_is_array) {
                        i = val.length;
                        while (i--) {
                          if (
                            val[i] === null ||
                            !val[i] ||
                            val[i].constructor === Array
                          )
                            val_is_array = true;
                          if (!val_is_array && val[i].constructor === Object)
                            val_is_array = true;
                        }
                      }
                      elem.push(this.scalar_to_xml(cname, val, val_is_array));
                      break;
                    }
                  /* falls through */
                  case String:
                    if (typeof val === 'string') {
                      val = val
                        .toString()
                        .replace(/\&/g, '&amp;')
                        .replace(/\r|\n/g, '&#13;');
                    }
                    if (cname === '#text') {
                      // prepare map
                      this.map.push(tree);
                      attr.push('d:mi="' + this.map.length + '"');
                      attr.push('d:constr="' + cnName + '"');
                      elem.push(this.escape_xml(val));
                      break;
                    }
                  /* falls through */
                  case Number:
                  case Boolean:
                    if (cname === '#text' && cnName !== 'String') {
                      // prepare map
                      this.map.push(tree);
                      attr.push('d:mi="' + this.map.length + '"');
                      attr.push('d:constr="' + cnName + '"');
                      elem.push(this.escape_xml(val));
                      break;
                    }
                    elem.push(this.scalar_to_xml(cname, val));
                    break;
                }
              }
            };
          if (tree.constructor === Array) {
            i = 0;
            il = tree.length;
            for (; i < il; i++) {
              fn(i.toString(), tree);
            }
          } else {
            for (key in tree) {
              fn(key, tree);
            }
          }
          if (!name) {
            name = 'd:data';
            attr.push(this.namespace);
            if (is_array) attr.push('d:constr="Array"');
          }
          if (name.match(this.rx_validate_name) === null) {
            attr.push('d:name="' + name + '"');
            name = 'd:name';
          }
          if (array_child) return elem.join('');
          // prepare map
          this.map.push(tree);
          attr.push('d:mi="' + this.map.length + '"');

          return (
            '<' +
            name +
            (attr.length ? ' ' + attr.join(' ') : '') +
            (elem.length ? '>' + elem.join('') + '</' + name + '>' : '/>')
          );
        },
        scalar_to_xml: function (name, val, override) {
          let attr = '',
            text,
            constr,
            cnName;

          // check whether the nodename is valid
          if (name.match(this.rx_validate_name) === null) {
            attr += ' d:name="' + name + '"';
            name = 'd:name';
            override = false;
          }
          if (val === null || val.toString() === 'NaN') val = null;
          if (val === null) return '<' + name + ' d:constr="null"/>';
          if (val.length === 1 && val.constructor === Array && !val[0]) {
            return '<' + name + ' d:constr="null" d:type="ArrayItem"/>';
          }
          if (val.length === 1 && val[0].constructor === Object) {
            text = this.hash_to_xml(false, val[0]);

            let a1 = text.match(this.rx_node),
              a2 = text.match(this.rx_constructor);
            a1 =
              a1 !== null
                ? a1[2]
                    .replace(this.rx_namespace, '')
                    .replace(/>/, '')
                    .replace(/"\/$/, '"')
                : '';
            a2 = a2 !== null ? a2[2] : '';

            text = text.match(this.rx_data);
            text = text !== null ? text[2] : '';

            return (
              '<' +
              name +
              a1 +
              ' ' +
              a2 +
              ' d:type="ArrayItem">' +
              text +
              '</' +
              name +
              '>'
            );
          } else if (val.length === 0 && val.constructor === Array) {
            return '<' + name + ' d:constr="Array"/>';
          }
          // else
          if (override) {
            return this.hash_to_xml(name, val, true);
          }

          constr = val.constructor;
          cnName = constr.toString().match(this.rx_function)[1];
          text =
            constr === Array
              ? this.hash_to_xml('d:item', val, true)
              : this.escape_xml(val);

          attr += ' d:constr="' + cnName + '"';
          // prepare map
          this.map.push(val);
          attr += ' d:mi="' + this.map.length + '"';

          return name === '#text'
            ? this.escape_xml(val)
            : '<' + name + attr + '>' + text + '</' + name + '>';
        },
        escape_xml: text =>
          String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/&nbsp;/g, '&#160;'),
      },
      toXML: function (tree, callback) {
        let interpreter = defiant.json.interpreter,
          compiled,
          processed,
          doc,
          task;

        // depending on request
        switch (typeof callback) {
          case 'function':
            // parse in a dedicated thread
            defiant.compiled.to_xml_str(tree, processed => {
              // snapshot distinctly improves performance
              callback({
                doc: defiant.xmlFromString(processed.str),
                src: tree,
                map: processed.map,
              });
            });
            return;
          case 'boolean':
            processed = interpreter.to_xml_str.call(interpreter, tree);
            // return snapshot
            return {
              doc: defiant.xmlFromString(processed.str),
              src: tree,
              map: processed.map,
            };
          default:
            processed = interpreter.to_xml_str.call(interpreter, tree);
            doc = defiant.xmlFromString(processed.str);

            this.search.map = processed.map;
            return doc;
        }
      },
      search: (tree, xpath, single) => {
        if (
          tree.constructor === String &&
          tree.slice(0, 9) === 'snapshot_' &&
          defiant.snapshots[tree]
        ) {
          tree = defiant.snapshots[tree];
        }

        let self = defiant.json,
          isSnapshot = tree.doc && tree.doc.nodeType,
          doc = isSnapshot ? tree.doc : self.toXML(tree),
          map = isSnapshot ? tree.map : self.search.map,
          src = isSnapshot ? tree.src : tree,
          xres = defiant.node[single ? 'selectSingleNode' : 'selectNodes'](
            doc,
            xpath.xTransform()
          ),
          ret = [],
          mapIndex,
          i;

        if (single) xres = [xres];
        i = xres.length;

        while (i--) {
          switch (xres[i].nodeType) {
            case 2:
            case 3:
              ret.unshift(xres[i].nodeValue);
              break;
            default:
              mapIndex = +xres[i].getAttribute('d:mi');
              //if (map[mapIndex-1] !== false) {
              ret.unshift(map[mapIndex - 1]);
            //}
          }
        }

        // if environment = development, add search tracing
        if (defiant.env === 'development') {
          ret.trace = self.matchTrace(src, ret, xres);
        }

        return ret;
      },
      matchTrace: (root, hits, xres) => {
        let trace = [],
          fIndex = 0,
          win = window,
          toJson = defiant.node.toJSON,
          stringify = data =>
            JSON.stringify(data, null, '\t').replace(/\t/g, ''),
          jsonStr = stringify(root);
        xres.map((item, index) => {
          let constr,
            pJson,
            pStr,
            hit,
            hstr,
            pIdx,
            lines,
            len = 0;
          switch (item.nodeType) {
            case 2:
              constr = xres[index].ownerElement
                ? xres[index].ownerElement.getAttribute(
                    'd:' + xres[index].nodeName
                  )
                : 'String';
              hit = win[constr](hits[index]);
              hstr = '"@' + xres[index].nodeName + '": ' + hit;
              pIdx = jsonStr.indexOf(hstr, fIndex);
              break;
            case 3:
              constr = xres[index].parentNode.getAttribute('d:constr');
              hit = win[constr](hits[index]);
              hstr =
                '"' +
                xres[index].parentNode.nodeName +
                '": ' +
                (hstr === 'Number' ? hit : '"' + hit + '"');
              pIdx = jsonStr.indexOf(hstr, fIndex);
              break;
            default:
              constr = item.getAttribute('d:constr');
              if (['String', 'Number'].indexOf(constr) > -1) {
                pJson = toJson(xres[index].parentNode);
                pStr = stringify(pJson);
                hit = win[constr](hits[index]);
                hstr =
                  '"' +
                  xres[index].nodeName +
                  '": ' +
                  (constr === 'Number' ? hit : '"' + hit + '"');
                pIdx = jsonStr.indexOf(pStr, fIndex) + pStr.indexOf(hstr);
              } else {
                hstr = stringify(hits[index]);
                pIdx = jsonStr.indexOf(hstr);
                len = hstr.split('\n').length - 1;
              }
          }
          fIndex = pIdx + 1;
          lines = jsonStr.slice(0, pIdx).split('\n').length;
          trace.push([lines, len]);
        });
        return trace;
      },
    },
  };

  /*
   * x10.js v0.1.3
   * Web worker wrapper with simple interface
   * Copyright (c) 2013-2019, Hakan Bilgin <hbi@longscript.com>
   * Licensed under the MIT License
   */
  const x10 = {
    id: 1,
    work_handler: event => {
      const args = Array.prototype.slice.call(event.data, 2),
        func = event.data[0],
        taskId = event.data[1],
        ret = tree[func].apply(tree, args);

      // make sure map is pure json
      ret.map = JSON.parse(JSON.stringify(ret.map));

      // return process finish
      postMessage([taskId, func, ret]);
    },
    setup: function (tree) {
      const url = window.URL || window.webkitURL,
        script = 'let tree = {' + this.parse(tree).join(',') + '};',
        blob = new Blob(
          [
            script +
              'self.addEventListener("message", ' +
              this.work_handler.toString() +
              ', false);',
          ],
          { type: 'text/javascript' }
        ),
        worker = new Worker(url.createObjectURL(blob));

      // thread pipe
      worker.onmessage = event => {
        const args = Array.prototype.slice.call(event.data, 2),
          taskId = event.data[0],
          func = event.data[1];

        x10.observer.emit('x10:' + func + taskId, args);
        x10.observer.off('x10:' + func + taskId);
      };

      return worker;
    },
    call_handler: (func, worker) => () => {
      const args = Array.prototype.slice.call(arguments, 0, -1),
        callback = arguments[arguments.length - 1],
        taskId = x10.id++;

      // add task id
      args.unshift(taskId);

      // add method name
      args.unshift(func);

      // listen for 'done'
      x10.observer.on('x10:' + func + taskId, event => {
        callback(event.detail[0]);
      });

      // start worker
      worker.postMessage(args);
    },
    compile: function (hash) {
      let worker = this.setup(
          typeof hash === 'function' ? { func: hash } : hash
        ),
        obj = {},
        fn;
      // create return object
      if (typeof hash === 'function') {
        obj.func = this.call_handler('func', worker);
        return obj.func;
      } else {
        for (fn in hash) {
          obj[fn] = this.call_handler(fn, worker);
        }
        return obj;
      }
    },
    parse: function (tree, isArray) {
      let hash = [],
        key,
        val,
        v;

      for (key in tree) {
        v = tree[key];
        // handle null
        if (v === null) {
          hash.push(key + ':null');
          continue;
        }
        // handle undefined
        if (v === undefined) {
          hash.push(key + ':undefined');
          continue;
        }
        switch (v.constructor) {
          case Date:
            val = 'new Date(' + v.valueOf() + ')';
            break;
          case Object:
            val = '{' + this.parse(v).join(',') + '}';
            break;
          case Array:
            val = '[' + this.parse(v, true).join(',') + ']';
            break;
          case String:
            val = '"' + v.replace(/"/g, '\\"') + '"';
            break;
          case RegExp:
          case Function:
            val = v.toString();
            break;
          default:
            val = v;
        }
        if (isArray) hash.push(val);
        else hash.push(key + ':' + val);
      }
      return hash;
    },
    // simple event emitter
    observer: (() => {
      const stack = {};

      return {
        on: (type, fn) => {
          if (!stack[type]) {
            stack[type] = [];
          }
          stack[type].unshift(fn);
        },
        off: (type, fn) => {
          if (!stack[type]) return;
          const i = stack[type].indexOf(fn);
          stack[type].splice(i, 1);
        },
        emit: (type, detail) => {
          if (!stack[type]) return;
          let event = {
              type: type,
              detail: detail,
              isCanceled: false,
              cancelBubble: function () {
                this.isCanceled = true;
              },
            },
            len = stack[type].length;
          while (len--) {
            if (event.isCanceled) return;
            stack[type][len](event);
          }
        },
      };
    })(),
  };

  // extending STRING
  if (!String.prototype.fill) {
    String.prototype.fill = function (i, c) {
      let str = this;
      c = c || ' ';
      for (; str.length < i; str += c) {}
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
      let str = this;
      if (this.indexOf('translate(') === -1) {
        str = this.replace(/contains\(([^,]+),([^\\)]+)\)/g, (c, h, n) => {
          const a = 'abcdefghijklmnopqrstuvwxyzåäö';
          return (
            'contains(translate(' +
            h +
            ', "' +
            a.toUpperCase() +
            '", "' +
            a +
            '"),' +
            n.toLowerCase() +
            ')'
          );
        });
      }
      return str.toString();
    };
  }

  /* jshint ignore:start */
  if (typeof JSON === 'undefined') {
    window.JSON = {
      parse: sJSON => eval('(' + sJSON + ')'),
      stringify: function (vContent) {
        if (vContent instanceof Object) {
          let sOutput = '';
          if (vContent.constructor === Array) {
            for (
              let nId = 0;
              nId < vContent.length;
              sOutput += this.stringify(vContent[nId]) + ',', nId++
            );
            return '[' + sOutput.substr(0, sOutput.length - 1) + ']';
          }
          if (vContent.toString !== Object.prototype.toString) {
            return '"' + vContent.toString().replace(/"/g, '\\$&') + '"';
          }
          for (const sProp in vContent) {
            sOutput +=
              '"' +
              sProp.replace(/"/g, '\\$&') +
              '":' +
              this.stringify(vContent[sProp]) +
              ',';
          }
          return '{' + sOutput.substr(0, sOutput.length - 1) + '}';
        }
        return typeof vContent === 'string'
          ? '"' + vContent.replace(/"/g, '\\$&') + '"'
          : String(vContent);
      },
    };
  }
  /* jshint ignore:end */

  // compile interpreter with 'x10.js'
  defiant.compiled = x10.compile(defiant.json.interpreter);
  defiant.search = defiant.json.search;
  defiant.x10 = x10;

  JSON.search = (data, xpath, first) => {
    console.warn(
      '[Deprication] Defiant will stop extending the JSON object. Please use this method instead; "defiant.json.search".'
    );
    return defiant.json.search(data, xpath, first);
  };
  JSON.toXML = data => {
    console.warn(
      '[Deprication] Defiant will stop extending the JSON object. Please use this method instead; "defiant.json.toXML".'
    );
    return defiant.json.toXML(data);
  };

  NodeList.prototype.map = Array.prototype.map;

  window.defiant = window.defiant || defiant;
  module.exports = defiant;
})(
  typeof window !== 'undefined' ? window : {},
  typeof module !== 'undefined' ? module : {}
);

// this is IE polyfill
if (!window.XSLTProcessor && typeof XSLTProcessor === 'undefined') {
  // emulating XSLT Processor (enough to be used in defiant)
  const XSLTProcessor = () => {};
  XSLTProcessor.prototype = {
    importStylesheet: function (xsldoc) {
      this.xsldoc = xsldoc;
    },
    transformToFragment: function (data, doc) {
      const str = data.transformNode(this.xsldoc),
        span = document.createElement('span');
      span.innerHTML = str;
      return span;
    },
  };
} else if (typeof XSLTProcessor !== 'function' && !window.XSLTProcessor) {
  // throw error
  throw 'XSLTProcessor transformNode not implemented';
}
