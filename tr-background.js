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
    workoutMap[details.tabId] = JSON.parse(json);
    browser.pageAction.show(details.tabId);
  };
}

browser.webRequest.onBeforeRequest.addListener(
  interceptWorkoutRequest,
  { urls: ["https://www.trainerroad.com/app/api/workoutdetails/*"] },
  ["blocking"]
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

function trainerroadToZwiftout(json) {
  const timeData = json.Workout.workoutData;
  const intervals = json.Workout.intervalData;

  function getPowerRange(start, end) {
    const startMs = start * 1000;
    const endMs = end * 1000;
    let startPower = 0;
    let endPower = 0;
    for (const time of timeData) {
      if (startMs === time.seconds) {
        startPower = time.ftpPercent;
      }
      if (endMs === time.seconds) {
        endPower = time.ftpPercent;
        break;
      }
    }
    return [startPower, endPower];
  }

  function stripTags(html) {
    return html.replace(/<\/?\w+>/g, "");
  }

  function formatDuration(seconds) {
    const ss = String(seconds % 60).padStart(2, "0");
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  const result = [];
  result.push(`Name: ${json.Workout.Details.WorkoutName}`);
  result.push(`Author: TrainerRoad`);
  result.push(
    `Description: ${stripTags(json.Workout.Details.WorkoutDescription)}`
  );
  result.push("");

  intervals.forEach((interval) => {
    if (interval.Name === "Workout") {
      return;
    }
    const duration = formatDuration(interval.End - interval.Start);
    const [startPower, almostEndPower] = getPowerRange(
      interval.Start,
      interval.End - 1
    );
    const type = startPower <= 50 && almostEndPower <= 50 ? "Rest" : "Interval";

    if (startPower === almostEndPower) {
      result.push(`${type}: ${duration} ${startPower}%`);
    } else {
      const [startPower, endPower] = getPowerRange(
        interval.Start,
        interval.End
      );
      if (Math.abs(endPower - almostEndPower) < 1) {
        result.push(`${type}: ${duration} ${startPower}%..${endPower}%`);
      } else {
        result.push(
          `${type}: ${duration} ${startPower}%..${Math.round(almostEndPower)}%`
        );
      }
    }
  });

  return result.join("\n");
}
