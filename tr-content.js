browser.runtime.onMessage.addListener((message) => {
  console.log("Received workout!");
  console.log(message);
});
