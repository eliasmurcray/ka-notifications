console.log("Popup opened");
chrome.storage.local
	.get(["prefetch_data", "prefetch_cursor"])
	.then(({ prefetch_data, prefetch_cursor }) => {
		console.log(prefetch_data, prefetch_cursor);
	});
