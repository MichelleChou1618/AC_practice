// function HelloWorld() {
//   console.log("Hello World!")
// }

// HelloWorld()

//向這個網址發送請求，如果成功收到回應，就在 console 裡印出回應的資料；如果失敗，就把錯誤資訊抓出來，並在 console 裡印出錯誤資訊
axios.get('https://webdev.alphacamp.io/api/lyrics/Coldplay/Yellow.json').then(function (response) {
  console.log(response.data)
}).catch(function (error) {
  console.log(error)
})
