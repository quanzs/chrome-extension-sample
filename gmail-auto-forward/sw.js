chrome.action.onClicked.addListener((tab) => {
  // chrome.scripting.insertCSS({
  //   target: { tabId: tab.id },
  //   files: ["content-script.css"],
  // });
  // chrome.scripting.executeScript({
  //   target: { tabId: tab.id },
  //   func: injectedFunction,
  // });
  chrome.storage.local.set({ startTime: Date.now() }).then(() => {
    console.log("Value is set");
  });
  // chrome.tabs.create(
  //   {
  //     url: "https://mail.google.com/mail/u/0/#settings/fwdandpop",
  //   },
  //   (createdTab) => {
  //     console.log("****created");
  //     chrome.scripting.executeScript({
  //       target: { tabId: createdTab.id },
  //       files: ["gmail-content-script.js"],
  //     });
  //   }
  // );
  chrome.windows.create(
    {
      url: "https://mail.google.com/mail/u/0/#settings/fwdandpop",
      focused: true,
      type: "popup",
      width: 800,
      height: 600,
      left: 100,
      top: 100,
    },
    (win) => {
      console.log("****created", win);
      chrome.scripting.executeScript({
        target: { tabId: win.tabs[0].id },
        files: ["gmail-content-script.js"],
      });
    }
  );
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // listen for messages sent from background.js
  if (request.message === "hello!") {
    console.log(request.url); // new url is now in content scripts!
  }
});

// TODO 这里需要保活 五分钟或者更长时间
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // read changeInfo data and do something with it
  // like send the new url to contentscripts.js
  if (changeInfo.url) {
    console.log("******send");
    chrome.tabs.sendMessage(tabId, {
      message: "url-change",
      url: changeInfo.url,
    });
  }
});
