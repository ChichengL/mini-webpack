let b = "b";
const { a } = require("./a");
function hello() {
	console.log("hello from b.js is a+B", a + b);
}

module.exports = {
	b,
	hello,
};
