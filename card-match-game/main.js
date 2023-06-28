/*運用 MVC 架構來分類程式碼*/

/*宣告通用變數or常數
註: 若常數儲存的資料不會變動，習慣上將首字母大寫以表示此特性*/

//花色圖片
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

//設定遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

/*utility: 外掛函式庫 => 從外面拿進來的演算法, 不屬於MVC 架構, 都存在這個模組裡*/
/*包含function如下:
i) getRandomNumberArray(): 產生一個隨機item的array(洗牌並回傳洗完後的array)
*/
const utility = {
  //洗牌演算法：Fisher-Yates Shuffle
  /*從最底部的卡牌開始，將它抽出來與前面的隨機一張牌交換。
    接著做第二張牌、第三張牌⋯⋯以此類推，逐次做到頂部的第二張牌為止，卡片就從頭到尾被隨機排序過一次了！
    每次要洗牌時，將最後一張牌不斷地和前面的卡牌交換位置，就可以保證每一張牌都被換過。*/
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys()) //生成連續數字陣列
    //選定想交換的位置
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;//找到一個隨機項目
      [number[index], number[randomIndex]] = [number[randomIndex], number[index]]//交換陣列元素
    }
    return number
  }
}


/*做的事情都和畫面顯示有關，屬於 Model-View-Controller 裡面的 View*/
// 當物件的屬性與函式/變數名稱相同時，可以省略不寫
/*包含的functions如下:
  iv) getCardElement():渲染牌背元件(遊戲初始化時會透過 view.displayCards 直接呼叫)
  i) getCardContent (): 負責生成卡片內容，包括花色和數字(使用者點擊時才由負責翻牌的函式來呼叫)
  ii) displayCards (): 負責選出 #cards 並抽換內容
  iii) transformNumber(): 特殊數字轉換
  v) flipCards(): 翻牌(不管傳述的card有幾張, 都適用)
  vi) pairCards(): 改變卡片底色(不管傳述的card有幾張, 都適用)
  vii) renderScore(): 更新score至UI
  viii) renderTriedTimes(): 更新triedTimes至UI
  ix) appendWrongAnimation(): 播放matchFailed卡片動畫
  x) showGameFinished(): 顯示遊戲結束畫面
*/
const view = {

  //getCardElement():渲染牌背元件(遊戲初始化時會透過 view.displayCards 直接呼叫)
  getCardElement(index) {
    //取得卡片索引：在元素上設定 data-set => 把卡片索引 (0~51) 綁定在牌背的 template 裡，才能在使用者點擊卡片時，透過 event.target 回傳給後端程式做運算。
    return `<div data-index=${index} class="card back"></div>`
  },

  //getCardContent (): 負責生成卡片內容，包括花色和數字(使用者點擊時才由負責翻牌的函式來呼叫)
  /*資料結構:
  0-12：黑桃 1-13
  13-25：愛心 1-13
  26-38：方塊 1-13
  39-51：梅花 1-13*/
  getCardContent(index) {

    //運算花色與數字
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]

    return `
      <div class="card">
        <p>${number}</p>
        <img src=${symbol}>
        <p>${number}</p>
      </div>
`
  },
  //transformNumber(): 特殊數字轉換 => 若是 1、11、12、13 的狀況，則分別回傳 A、J、Q、K，如果數字是 2-10，則把數字原封不動地回傳
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A';
      case 11:
        return 'J';
      case 12:
        return 'Q';
      case 13:
        return 'K';
      default:
        return number
    }

  },

  //displayCards (): 負責選出 #cards 並抽換內容
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    //rootElement.innerHTML = this.getCardElement(24)
    //逐步驗證過程: 產生 52 個 DOM 元素並拼裝 template
    // const cardsArray = Array.from(Array(52).keys()).map(index => this.getCardElement(index)).join("")
    // console.log(cardsArray)
    //rootElement.innerHTML = Array.from(Array(52).keys()).map(index => this.getCardElement(index)).join("")
    //牌桌預設顯示牌背
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join("")
  },

  //flipCard(): 翻牌
  /* 點擊一張覆蓋的卡片 → 回傳牌面內容(數字和花色)
     點擊一張翻開的卡片 → 重新覆蓋卡片，意即把牌面內容清除，重新呼叫牌背樣式(背景) */
  //改寫flipCard() → flipCards(): 不管傳入幾個參數，都用 map 來迭代, 減少function被重call次數
  /*如果只有一個值，就會在傳進 flipCards 的時候，被三個點變成陣列。
    如果是傳入陣列，就會先用 ... 展開成個別值，再於傳進 flipCards 的時候，又被 ... 變成陣列。*/
  flipCards(...cards) {
    //console.log(card.dataset.index)

    cards.map(card => {
      if (card.classList.contains("back")) {
        // 回傳正面
        card.classList.remove("back")
        card.innerHTML = this.getCardContent(Number(card.dataset.index)) // 暫時給定 10
      } else {
        // 回傳背面
        card.classList.add("back")
        card.innerHTML = null
      }
    }
    )
    /*
    if (card.classList.contains("back")) {
      // 回傳正面
      card.classList.remove("back")
      card.innerHTML = this.getCardContent(Number(card.dataset.index)) // 暫時給定 10
    } else {
      // 回傳背面
      card.classList.add("back")
      card.innerHTML = null
    }
    */
  },

  // pairCard(): 改變卡片底色
  // pairCard() 改成 pairCards(): 不管傳入幾個參數，都用 map 來迭代, 減少function被重call次數
  pairCards(...cards) {
    
    cards.map(card => {
      card.classList.add('paired')
    }

    )
    
    //card.classList.add('paired')
  },

  //renderScore(): 更新score至UI
  renderScore(score) {
    document.querySelector(".score").textContent = `Score: ${score}`;
  },

  //renderTriedTimes(): 更新triedTimes至UI
  renderTriedTimes(times) {
    document.querySelector(".tried").textContent = `You've tried: ${times} times`;
  },

  //appendWrongAnimation(): 播放matchFailed卡片動畫
  /*這個函式裡會為卡片加入 .wrong 類別，一旦加入就會開始跑動畫。另外我們用事件監聽器來綁定「動畫結束事件 (animationend)」，一旦動畫跑完一輪，就把 .wrong 這個 class 拿掉。

  最後的 {once: true} 是要求在事件執行一次之後，就要卸載這個監聽器。因為同一張卡片可能會被點錯好幾次，每一次都需要動態地掛上一個新的監聽器，並且用完就要卸載。*/
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add("wrong")
      card.addEventListener('animationend', event => 
      event.target.classList.remove('wrong'), {once:true}
       )
    })

  },

  //showGameFinished(): 顯示遊戲結束畫面
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  },
}

//宣告 Model: 集中管理資料的地方, 包含的attributes, functions如下:
/*
i) revealedCards: 被翻開的卡片 => 一個暫存牌組，使用者每次翻牌時，就先把卡片丟進這個牌組，集滿兩張牌時就要檢查配對有沒有成功，檢查完以後，這個暫存牌組就需要清空。
ii) isRevealedCardsMatched() : 檢查使用者翻開的兩張卡片是否相同, 回傳布林值
iii) score: 計分
iv) triedTimes: 計算嘗試次數
*/
const model = {
  revealedCards: [],
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score:0,
  triedTimes: 0,

}


//宣告 controller 物件:
//所有動作應該由 controller 統一發派，view 或 model 等其他元件只有在被 controller 呼叫時，才會動作。
// 包含的attributes, functions如下:
/*
i) currentState 屬性: 用來標記目前的遊戲狀態 => 初始狀態設定為 FirstCardAwaits，也就是「還沒翻牌」
ii) generateCards(): 在 controller 內部呼叫 view.displayCards
iii) dispatchCardAction(): 依照當下的遊戲狀態，發派工作給 view 和 controller。
*/
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  dispatchCardAction(card) {
    //不是牌背狀態的卡片，代表已被點擊／已配對，即使再次點擊也不應該執行動作
    if (!card.classList.contains('back')) {
      return
    }

    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷配對是否成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功 => 維持翻開並改變樣式
          view.renderScore(model.score += 10) 
          this.currentState = GAME_STATE.CardsMatched
          //console.log("配對成功")
          /*
          view.pairCard(model.revealedCards[0])
          view.pairCard(model.revealedCards[1])
          */
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()  // 加在這裡
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits

        }else {
          // 配對失敗
          //console.log("配對失敗")
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          /*瀏覽器提供給 JavaScript 使用的 API，可以呼叫瀏覽器內建的計時器，第一個參數是想要執行的函式內容，第二個參數是停留的毫秒 (1000 毫秒為 1 秒)，在計時器跑完以後，就會執行函式內容。*/
          setTimeout(this.resetCards,1000)
          /*
          setTimeout(() => {
            /*
            view.flipCard(model.revealedCards[0])
            view.flipCard(model.revealedCards[1])
            
            view.flipCards(...model.revealedCards)
            model.revealedCards = []
            this.currentState = GAME_STATE.FirstCardAwaits
          }, 1000)
          */
        }
        
        break
    }

    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))

  },

  resetCards () {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    //this.currentState = GAME_STATE.FirstCardAwaits
    /* this 在搬進 resetCards 之後要改成 controller
    我們期待 this 要指向 controller，然而當我們把 resetCards 當成參數傳給 setTimeout 時，this 的對象變成了 setTimeout，而 setTimeout 又是一個由瀏覽器提供的東西，而不是我們自己定義在 controller 的函式。*/
    controller.currentState = GAME_STATE.FirstCardAwaits
  },
}



//initial display: 渲染卡片
//view.displayCards()
controller.generateCards()

//為每一個 .card 產生監聽器，總共需要 52 個監聽器:
//i) 讓使用者透過滑鼠點擊的方式來為卡牌翻面。
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", event => {
    //測試看看事件監聽器有沒有成功綁定
    //console.log(card)
    //view.flipCard(card)
    controller.dispatchCardAction(card)
  })
})

