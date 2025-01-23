const { b, hello } = require("./b");
function add(a, b) {
	return a + b;
}
let a = "a";
module.exports = {
	add,
	a,
};
