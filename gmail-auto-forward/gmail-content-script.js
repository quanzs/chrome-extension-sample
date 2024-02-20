/** common functions start */
var whenReady = (function () {
  var funcs = [];
  var ready = false;

  function handler(e) {
    if (ready) return;

    if (e.type === "onreadystatechange" && document.readyState !== "complete") {
      return;
    }

    for (var i = 0; i < funcs.length; i++) {
      funcs[i].call(document);
    }
    ready = true;
    funcs = null;
  }

  if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", handler, false);
    document.addEventListener("readystatechange", handler, false);
    window.addEventListener("load", handler, false);
  } else if (document.attachEvent) {
    document.attachEvent("onreadystatechange", handler);
    window.attachEvent("onload", handler);
  }

  return function whenReady(fn) {
    if (ready) {
      fn.call(document);
    } else {
      funcs.push(fn);
    }
  };
})();

function runIfPageIsReady(fn) {
  if (!fn) {
    return;
  }
  if (document.readyState == "complete") {
    console.log("***run");
    fn();
  } else {
    console.log("***whenReady");
    whenReady(fn);
  }
}

function sleep(t) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, t);
  });
}

function reloadWindow() {
  location.reload();
}
/** common functions end */

function insertHTML(html, id) {
  if (!document.querySelector(`#${id}`)) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<div id='${id}'>${html}</div>`
    );
  } else {
    document.querySelector(`#${id}`).innerHTML = html;
  }
}

const TARGET_EMAIL = "ontest_qzs@onmail.com";

async function init(url, reason) {
  console.log("****init", url, reason);
  const timeObj = await chrome.storage.local.get("startTime");
  console.log("startTime is ", Date.now() - timeObj.startTime);
  if (timeObj && Date.now() - timeObj.startTime > 60 * 1000) {
    console.log("Progress is timeout");
    return;
  }

  await chrome.storage.local.set({ startTime: Date.now() });

  if (url.includes("/#inbox")) {
    insertHTML("<h1>Setting auto-forward address</h1>", "loading-div");
    console.log("*****goto settings");
    runIfPageIsReady(async () => {
      await sleep(2000);
      location.href = location.href.replace(/(\/#.*)/g, "/#settings/fwdandpop");
    });
    return;
  } else if (url.includes("/#settings/fwdandpop")) {
    insertHTML("<h1>Setting auto-forward address</h1>", "loading-div");
    runIfPageIsReady(async () => {
      await sleep(2000);
      console.log("*****start");
      var addBtn = document.querySelector("[act=add]");
      if (!addBtn) {
        console.log("*****retry");
        init(url);
        return;
      }
      var parentContainer = addBtn.parentElement.parentElement;
      if (parentContainer.innerHTML.includes(TARGET_EMAIL)) {
        console.log("*****select target email");
        var radios = parentContainer.querySelectorAll("input[type=radio]");
        if (radios.length) {
          for (var i = 0; i < radios.length; i++) {
            if (
              radios[i].checkVisibility() &&
              radios[i].closest("tr").innerHTML.includes(TARGET_EMAIL) &&
              radios[i].checked
            ) {
              console.log("*****already done!");
              document.querySelector("#loading-div").style.display = "none";
              return;
            } else if (
              radios[i].checkVisibility() &&
              radios[i].closest("tr").innerHTML.includes(TARGET_EMAIL) &&
              !radios[i].checked
            ) {
              radios[i].click();
              document
                .querySelector("[guidedhelpid=save_changes_button]")
                .click();
              document.body.insertAdjacentHTML(
                "afterbegin",
                "<div id='success-div'><h1>Done!</h1></div>"
              );
              return;
            }
          }
          console.log("*****reload and check");
          await sleep(4000);
          location.href = location.href.replace(/(\/#.*)/g, "/#inbox");
        }
        return;
      }
      addBtn.click();
      await sleep(1000);
      document.querySelector("[role=alertdialog] input").focus();
      await sleep(1000);
      document.querySelector("[role=alertdialog] input").value = TARGET_EMAIL;
      await sleep(1000);
      document.querySelector("[role=alertdialog] input").blur();

      await sleep(1000);
      console.log("****click");
      document.querySelector("[role=alertdialog] button").click();

      await sleep(5000);
      const dialogs = document.querySelectorAll("[role=alertdialog]");

      console.log("****dialogs.length", dialogs.length);
      if (dialogs.length > 1) {
        // const spans = dialogs[1].querySelectorAll("span");
        // spans[spans.length - 2].trigger("click");
        // window.open("https://www.baidu.com");
        // window.open("dialog.html", "dialogWindowName", "dialogFeatures");
        var imgUrl = chrome.runtime.getURL(`images/allowPopout.png`);
        insertHTML(
          `
        <h2>Please enable "Always allow pop-ups ...", then click "Reload" button.</h2>
        <button>Reload</button>
        <img src="${imgUrl}" />
        `,
          "warning-dialog"
        );
        document
          .querySelector("#warning-dialog button")
          .addEventListener("click", reloadWindow);
      } else {
        // start checking if the confirmation link has been clicked
        intervalCheck();
      }
    });
  }
  // In the popout window, the 2FA is passed
  else if (url.includes("/?scd=1") || url.includes("mail-settings")) {
    insertHTML(`<h1>Loading</h1>`, "popout-loading-div");
    document.querySelector("form").submit();
  }
}

async function intervalCheck() {
  const btn = document.querySelector("[role=alertdialog] button[name=ok]");
  if (btn) {
    btn.click();
    console.log("*****intervalCheck btn", btn);
    await sleep(3000);
    init(location.href);
    return;
  }
  console.log("*****intervalCheck next");
  setTimeout(intervalCheck, 3000);
}

init(location.href, "init");

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // listen for messages sent from background.js
  if (request.message === "url-change") {
    console.log("url", request.url); // new url is now in content scripts!
    init(request.url, "url changed");
  }
});
