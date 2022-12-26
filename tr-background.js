let workout = undefined;

function interceptWorkoutRequest(details) {
  const filter = browser.webRequest.filterResponseData(details.requestId);
  const bytes = [];

  filter.ondata = (event) => {
    bytes.push(...new Uint8Array(event.data));
    filter.write(event.data);
  };

  filter.onstop = (event) => {
    filter.disconnect();
    const fullData = new Uint8Array(bytes);
    const json = new TextDecoder("utf-8").decode(fullData);
    workout = JSON.parse(json);
  };
}

browser.webRequest.onBeforeRequest.addListener(
  interceptWorkoutRequest,
  { urls: ["https://www.trainerroad.com/app/api/workoutdetails/*"] },
  ["blocking"]
);

async function sendWorkoutToActiveTab() {
  const tabs = await browser.tabs.query({
    currentWindow: true,
    active: true,
  });
  browser.tabs.sendMessage(tabs[0].id, workout);
}

browser.browserAction.onClicked.addListener(sendWorkoutToActiveTab);
