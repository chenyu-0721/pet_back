const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      // required: [true, "Category is required"],。
      default: 0,
    },
    image: {
      type: String,
      default: 0,
      // required: [true, "image is required"],
    },
    title: {
      type: String,
      default: 0,
      // required: [true, "title is required"],
    },
    price: {
      type: Number,
      default: 0,
      // required: [true, "price is required"],
    },
    unit: {
      type: String,
      default: 0,
      // required: [true, "unit is required"],
    },
    vriety: {
      type: String,
      default: 0,
      required: [true, "variety is required"],
    },
    classification: {
      type: String,
      default: 0,
    },
    popular: {
      type: Boolean,
      default: 0,
    },
    newproduct: {
      type: Boolean,
      default: 0,
    },
  },
  { versionKey: false }
);

const Post = mongoose.model("Post", postSchema);
module.exports = Post;
