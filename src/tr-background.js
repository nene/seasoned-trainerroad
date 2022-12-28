import trainerroadToZwiftout from "trainerroad-to-zwiftout";

// Map from tabid to workout
const workoutMap = {};

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
    const workout = JSON.parse(json);
    if (workout?.Workout) {
      workoutMap[details.tabId] = workout.Workout;
      browser.pageAction.show(details.tabId);
    } else {
      workoutMap[details.tabId] = undefined;
      browser.pageAction.hide(details.tabId);
    }
  };
}

browser.webRequest.onBeforeRequest.addListener(
  interceptWorkoutRequest,
  { urls: ["https://www.trainerroad.com/app/api/workoutdetails/*"] },
  ["blocking"]
);

const isWorkoutPage = (url) =>
  /https:\/\/www.trainerroad.com\/app\/cycling\/workouts\/\w+/i.test(url);

function interceptMainPageRequest(details) {
  // is it the top-level document?
  if (details.frameId === 0) {
    // When not on workout page, remove the workout entry (if any)
    // and hide the page-action button
    if (!isWorkoutPage(details.url)) {
      workoutMap[details.tabId] = undefined;
      browser.pageAction.hide(details.tabId);
    }
  }
}

browser.webNavigation.onBeforeNavigate.addListener(interceptMainPageRequest, {
  url: [{ urlPrefix: "https://www.trainerroad.com/" }],
});

browser.webNavigation.onHistoryStateUpdated.addListener(
  interceptMainPageRequest,
  {
    url: [{ urlPrefix: "https://www.trainerroad.com/" }],
  }
);

function sendWorkoutToEditor(tab) {
  const workout = workoutMap[tab.id];
  browser.tabs.create({
    url:
      "https://nene.github.io/workout-editor/#" +
      encodeURIComponent(trainerroadToZwiftout(workout)),
  });
}

browser.pageAction.onClicked.addListener(sendWorkoutToEditor);
