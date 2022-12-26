browser.runtime.onMessage.addListener((message) => {
  createPopup(trainerroadToZwiftout(message));
});

function createPopup(message) {
  const div = document.createElement("div");
  div.style.position = "absolute";
  div.style.top = "0";
  div.style.left = "200px";
  div.style.right = "200px";
  div.style.width = "800px";
  div.style.border = "1px solid gray";
  div.style.background = "white";

  const btn = document.createElement("button");
  btn.style.position = "absolute";
  btn.style.top = "2px";
  btn.style.right = "2px";
  btn.innerHTML = "X";
  btn.onclick = () => {
    document.body.removeChild(div);
  };
  div.appendChild(btn);

  const pre = document.createElement("pre");
  pre.innerHTML = message;
  div.appendChild(pre);

  document.body.appendChild(div);
}
