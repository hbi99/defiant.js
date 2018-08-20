
var defiant = require('../index.js');

var data = {
   "store": {
      "book": [
         {
            "title": "Sword of Honour",
            "category": "fiction",
            "author": "Evelyn Waugh",
            "@price": 12.99
         },
         {
            "title": "Moby Dick",
            "category": "fiction",
            "author": "Herman Melville",
            "isbn": "0-553-21311-3",
            "@price": 8.99
         },
         {
            "title": "Sayings of the Century",
            "category": "reference",
            "author": "Nigel Rees",
            "@price": 8.95
         },
         {
            "title": "The Lord of the Rings",
            "category": "fiction",
            "author": "J. R. R. Tolkien",
            "isbn": "0-395-19395-8",
            "@price": 22.99
         }
      ],
      "bicycle": {
         "brand": "Cannondale",
         "color": "red",
         "@price": 19.95
      }
   }
};

async function test_search() {
   var result = await defiant.search(data, '//book[position() <= 2]');
   console.log(result);
}

async function test_render() {
   var xsl = `<xsl:template name="books_template">
               <h1>Books</h1>
               <xsl:for-each select="//book">
                  <xsl:sort order="ascending" data-type="number" select="price"/>
                  <h2><xsl:value-of select="title"/></h2>
                  Author: <strong><xsl:value-of select="author"/></strong><br/>
                  Price: <xsl:value-of select="price"/>
               </xsl:for-each>
            </xsl:template>`;

   var data = {
        "store": {
          "book": [
            {
              "title": "The Lord of the Rings",
              "author": "J. R. R. Tolkien",
              "category": "Fiction",
              "price": 22.99
            },
            {
              "title": "Moby Dick",
              "author": "Herman Melville",
              "category": "Fiction",
              "price": 8.99
            }
          ]
        }
      };

   await defiant.register_template(xsl);

   var result = await defiant.render('books_template', data);
   console.log(result);
}

test_render();

