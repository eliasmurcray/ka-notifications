const { search, pathname } = window.location;
const split = pathname.split("/");
const twoBytes = /^\d{16}$/;
const isProject = (split[1] === "computer-programming" || split[1] === "cs") && twoBytes.test(split[2]);
const params = new URLSearchParams(search);


if(isProject) main();

function main() {
  
}