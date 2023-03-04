let oldParse = JSON.parse;
JSON.parse = function() {
  let data = oldParse.apply(this, arguments);
  console.log(data);
  return data;
};