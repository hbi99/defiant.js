
var defiant = require('../index.js');

(async () => {

  const data = {
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
  }

  const snapshot_id = await defiant.create_snapshot(data)
  console.log(snapshot_id)
  
  const test = await defiant.search(snapshot_id, '//book[position() <= 2]')
  console.log(test)

})()