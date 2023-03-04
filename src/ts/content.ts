const { search, pathname } = window.location;
const split = pathname.split("/");
const isProject = (split[1] === "computer-programming" || split[1] === "cs") && /^\d{16}$/.test(split[3]);
const params = new URLSearchParams(search);

if(isProject) main();

function main() {
  console.log("Hello from KA Notifications Extension!");
  let oldParse = JSON.parse;
  JSON.parse = function(args) {
    console.log(args);
    oldParse(args);
  };
}