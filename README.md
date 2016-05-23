[![](http://goo.gl/7TGBFK)](http://defiantjs.com/)

DefiantJS provides the ability for you to build smart templates applicable on JSON structures, based upon proven &amp; standardized technologies such as XSLT and XPath.

DefiantJS also extends the global object __JSON__ with the method "__search__", which enables searches on JSON structures with XPath expressions and returns matches as an array-like object.

For detailed information, please visit [defiantjs.com](http://defiantjs.com) and try out the [XPath Evaluator](http://www.defiantjs.com/#xpath_evaluator) or...

###### :point_right: [![Join the chat at https://gitter.im/hbi99/defiantjs.com](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hbi99/defiantjs.com?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) <sup>Chat with Defiant.js users</sup>


###Example usage
* Snapshots - very large JSON
```js
var data = {
  // ...biiig JSON structure...
};

// this way has a non-blocking effect on the UI-thread
Defiant.getSnapshot(data, function(snapshot) {
  // executed when the snapshot is created
  found = JSON.search(snapshot, '//item');  
});

```

* Snapshot feature
```js
var data = {
  // ...large JSON structure...
};

// Regular search
found = JSON.search(data, '//item');

var snapshot = Defiant.getSnapshot(data);
// Snapshot search - this is more than 100 times faster than 'regular search'
found = JSON.search(snapshot, '//item');
```

* Simple search
```js
var data = [
       { "x": 2, "y": 0 },
       { "x": 3, "y": 1 },
       { "x": 4, "y": 1 },
       { "x": 2, "y": 1 }
    ],
    res = JSON.search( data, '//*[ y > 0 ]' );

console.log( res );
// [{ x=3, y=1}, { x=4, y=1}, { x=2, y=1}]
```

* XSLT Templating
```html
<!-- Defiant template -->
<script type="defiant/xsl-template">
    <xsl:template name="books_template">
        <xsl:for-each select="//movie">
            <xsl:value-of select="title"/><br/>
        </xsl:for-each>
    </xsl:template>
</script>
 
<script type="text/javascript">
    var data = {
            "movie": [{"title": "The Usual Suspects"},
                      {"title": "Pulp Fiction"},
                      {"title": "Independence Day"}]
        },
        htm = Defiant.render('books_template', data);
    console.log(htm);
    // The Usual Suspects<br>Pulp Fiction<br>Independence Day<br>
</script>
```

###Update highlights
- v1.2.6
As of this version, snapshots can be created with web workers - consequently the UI thread is not blocked when creating snapshots of large JSON structures.

- v1.2.0
As of version 1.2.0, the __snapshot__ feature was added. Using this feature, the performance of the search is increased by more than 100 times. Use 'snapshot search' when you are certain that the JSON structure hasn't been changed. If the structure changes, create a new snapshot and always make searches on the latest snapshot. The example below shows how it can be used.

### Changelog
- [x] `1.3.8` Handling null value in arrays
- [x] `1.3.7` Safari / VueJS related bugfix
- [x] `1.3.6` Fixed bug in gulp file
- [x] `1.3.5` Handling special occasion of 'null' in array
- [x] `1.3.4` Syncing up package version with release version
- [x] `1.3.3` Safari handles "XSLTProcessor" - adapting
- [x] `1.3.2` Throws error if "transformNode" is not supported
- [x] `1.3.1` Fixing MSIE11 detection
- [x] `1.3.0` Zero values threw error in "match tracer"
- [x] `1.2.9` Handling '\r\n' in string (throws error)
- [x] `1.2.8` Automatically case insensitive - global regular expression
- [x] `1.2.7` JSON data containing functions will throw error
- [x] `1.2.6` Snapshot can be created with web worker (x10.js)
- [x] `1.2.5` Bugfix related to not() preceding 'contains'-method
- [x] `1.2.4` UI-related bugg fix 
- [x] `1.2.2` The XPath method 'contains' is automatically case insensitive 
- [x] `1.2.0` Added snapshot search feature
