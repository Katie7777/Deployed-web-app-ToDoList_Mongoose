//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");//modify string

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//create database @ character should be percent encoding
mongoose.connect("mongodb+srv://Katie777:[password]@cluster0.ndwakdh.mongodb.net/todolistDB");
//create new item schema
const itemsSchema = {
  name: String
};
//create Model
const Item = mongoose.model("item",itemsSchema);
//create item

const item1 = new Item({
  name:"studying"
});

const item2 = new Item({
  name:"Walking"
});

const item3 = new Item({
  name:"cleaning"
});

const defaultItems = [item1, item2, item3];

//create new Schema -list object
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  Item.find({},function(err, foundItems){
    //if array is empty, give defualt items
    if(foundItems.length === 0){
      //insert to collection
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("successfully insert defaultItems");
        }
      });
      res.redirect("/");
    //else, display items in the list
    }else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });




});

//add new item to the list
app.post("/", function(req, res){
  //when use input new items in the web
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name:itemName
  });

//if user submit item in defualt list
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  //if user from customer list
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save(function(err, result){
        res.redirect("/" + listName);
      });

    });
  }


});

app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  //check if delete item on default list
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){//have to provide callback to delete item
      if(!err){
        console.log("Successfully remove the checked item.");
        res.redirect("/");
      }
    });
  //if delete item in customized list,pull from item array that item has itemid :checkedItemId
  }else{
    List.findOneAndUpdate({name: listName}, {$pull:{items:{_id: checkedItemId}}},function(err,foundList){
          if(!err){
            res.redirect("/" + listName);
          }
    })
  }

});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);



  //check if list has already existed
  List.findOne({name: customListName}, function(err,foundList){
    if(!err){
      if(!foundList){
        //create new list
        const list = new List({
          name: customListName,
          items:defaultItems
        });
        list.save(function(err,result){
            res.redirect("/" +customListName );
        });

      }else{
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});

      }
    }

  });

});


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
