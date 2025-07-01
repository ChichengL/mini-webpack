// const { b, hello } = require("./b");
import { b, hello } from "./b";
function add(a, b) {
  return a + b;
}
let a = "a";
module.exports = {
  add,
  a,
};

import testImage from "../assets/test.png";
const img = new Image();
img.src = testImage;
document.body.appendChild(img);
