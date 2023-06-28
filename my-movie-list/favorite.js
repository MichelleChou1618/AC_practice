const BASE_URL = 'https://webdev.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const movies = JSON.parse(localStorage.getItem('favoriteMovies')) //收藏清單
//const MOVIES_PER_PAGE = 12 //每頁只顯示 12 筆資料


// 1) 測試串接 Index API
// axios
//   .get(INDEX_URL)
//   .then((response) => {
//     console.log(response)
//     console.log(response.data)
//     console.log(response.data.results)
//     console.log(response.status)
//   })
//   .catch((err) => console.log(err))

// 將index資料塞入movies裡
// 方法一: 使用迭代器
// axios.get(INDEX_URL)
//   .then((response) => {
//     for (const movie of response.data.results) {
//       movies.push(movie)
//     }
//     console.log(movies)
//   }).catch((err) => console.log(err))
// 方法二: 使用展開運算子(spread operator)
// axios.get(INDEX_URL).then((response) => {
//   movies.push(...response.data.results)
//   console.log(movies)
// }).catch((err) => console.log(err))

// 2) 組合動態 HTML 樣板
// 2.1) 設計函式: 有兩件事需要完成，一是產生 80 部電影的 HTML 結構，第二，產生的同時，要把剛剛從 API 拿到的資料逐步放入 HTML 中
//實作步驟如下：
//使用 querySelector 選出 #data-panel
//撰寫一個函式 renderMovieList 來演算需要的 template literal，暫存在 rawHTML 這個變數中
//使用 innerHTML 將演算好的 rawHTML 放進 #data - panel
//2.2) 在電影卡片的 More button 標籤中，新增一個 data-id="${item.id}" 的屬性，也就是說，在動態組合樣板的時期，不只拿每部電影的 title 和 image 屬性，連 id 屬性也要放進來- for 5)
//2.3) 在電影卡片的 + button 標籤中，新增一個 data-id="${item.id}" 的屬性，-for 8
//2.4) 在電影卡片的 X button 標籤中，新增一個 data-id="${item.id}" 的屬性，-for 9
const dataPanel = document.querySelector('#data-panel')

renderMovieList(movies)

function renderMovieList(data) {
  let rawHTML = ''
  data.forEach((item) => {
    // title, image
    rawHTML += `<div class="col-sm-3">
    <div class="mb-2">
      <div class="card">
        <img src="${POSTER_URL + item.image
      }" class="card-img-top" alt="Movie Poster">
        <div class="card-body">
          <h5 class="card-title">${item.title}</h5>
        </div>
        <div class="card-footer">
          <button class="btn btn-primary btn-show-movie" data-id=${item.id} data-bs-toggle="modal" data-bs-target="#movie-modal">More</button>
          <button class="btn btn-danger btn-remove-favorite" data-id=${item.id}>X</button>
        </div>
      </div>
    </div>
  </div>`
  })
  dataPanel.innerHTML = rawHTML
}

//3) 調用函式:
//請在 axios 程式碼中的 then() 中呼叫它，並把 movies 傳進去
// axios
//   .get(INDEX_URL)
//   .then((response) => {
//     movies.push(...response.data.results)
//     renderMovieList(movies) //新增這裡
//   })
//   .catch((err) => console.log(err))

// 4) 委派點擊事件
// 監聽 data panel
dataPanel.addEventListener('click', function onPanelClicked(event) {
  if (event.target.matches('.btn-show-movie')) {
    // console.log(event.target.dataset.id) - 檢查是否有監聽到dataPanel
    showMovieModal(Number(event.target.dataset.id)) //refer to 6.2
  } else if (event.target.matches('.btn-remove-favorite')) {
    removeFromFavorite(Number(event.target.dataset.id)) //refer to 9.2
  }
})

// 5) 取出特定電影的 id 資訊:
//在存取 Index API 的資料時，將電影的 id 一併放進 template 裡。當按鈕被點擊時，就能把 id 挑出來然後組合出 Show API 需要的 URL。
//解決方案：dataset
//5.1) 在電影卡片的 More button 標籤中，新增一個 data-id="${item.id}" 的屬性 -refer to 2.2)
//5.2) 接著將點擊事件的回傳值改成 event.target.dataset.id - refer to 4)

//6)Request Show API 傳遞資料
//6.1) 宣告一個新的 showMovieModal 函式，並使用 axios 發送 request，然後將結果輸出至 modal。
function showMovieModal(id) {
  const modalTitle = document.querySelector('#movie-modal-title')
  const modalImage = document.querySelector('#movie-modal-image')
  const modalDate = document.querySelector('#movie-modal-date')
  const modalDescription = document.querySelector('#movie-modal-description')
  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data.results
    modalTitle.innerText = data.title
    modalDate.innerText = 'Release date: ' + data.release_date
    modalDescription.innerText = data.description
    modalImage.innerHTML = `<img src="${POSTER_URL + data.image
      }" alt="movie-poster" class="img-fluid">`
  })
}

//6.2)修改 More 按鈕的 click 事件，呼叫 showMovieModal 並傳入電影的 id 值- refer to 4)

//7) 打造「搜尋功能」
// 實作步驟能拆解成以下四個階段：

// 7.1) 將搜尋表單綁定提交事件，觸發搜尋功能
// 7.2) 取得搜尋框中使用者輸入的關鍵字
// 7.3) 比對搜尋關鍵字與電影標題
// 7.4) 將匹配結果回傳到網頁畫面上
// -------------------------------------------------------
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')

// 7.1) 將搜尋表單綁定提交事件，觸發搜尋功能
searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
  event.preventDefault() //預防瀏覽器預設行為(當使用者按下 Search 提交搜尋表單時，頁面不會刷新 (重新導向目前頁面))
  //console.log('click!') //測試用

  // 7.2) 取得搜尋框中使用者輸入的關鍵字
  //用 .value 取得 input 值
  //trim()：把字串頭尾空格去掉
  //toLowerCase()：把字串轉成小寫

  const keyword = searchInput.value.trim().toLowerCase()

  //加入錯誤處理：若使用者沒輸入東西就送出，會跳出警告訊息。
  //若隱藏: 當使用者沒有輸入任何關鍵字時，畫面顯示全部電影(在 include() 中傳入空字串，所有項目都會通過篩選）
  // if (!keyword.length) {
  //   return alert('請輸入有效字串！')
  // }

  // 7.3) 比對搜尋關鍵字與電影標題
  //使用 includes 方法比對字串, 再將篩選後符合條件的電影資料存入filteredMovies
  let filteredMovies = []
  //【作法一】用迴圈迭代：for-of
  //當一部的電影的 title 有包含 keyword 時，就把這部電影推進 filteredMovies 陣列裡：
  // for (const movie of movies) {
  //   if (movie.title.toLowerCase().includes(keyword)) {
  //     filteredMovies.push(movie)
  //   }
  // }

  //【作法二】用條件來迭代：filter
  //filter 需要的參數是一個條件函式，只有通過這個條件函式檢查的項目，才會被 filter 保留並回傳一個新的陣列。
  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  )

  //錯誤處理：無符合條件的結果
  if (filteredMovies.length === 0) {
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`)
  }
  // 7.4) 將匹配結果回傳到網頁畫面上
  renderMovieList(filteredMovies)


})

//8) 監聽事件，取得想收藏的電影
//8.1) 在 + 按鈕的 HTML 元素上帶 id - refer to 2.3
//8.2) 將收藏按鈕也納入監聽: 若使用者點擊了收藏按鈕，就會呼叫 addToFavorite() 並傳入電影的 id

//addToFavorite(): 將使用者點擊到的那一部電影送進 local storage 儲存起來
// a) 在 movies 陣列中，識別出被點擊的那部 movie 資料
// b) 將那部 movie 資料暫存起來
// c) 暫存起來以後放到收藏清單
// d) 將收藏清單存到 local storage
// e) 錯誤處理：已經在收藏清單的電影，不應被重複加
function addToFavorite(id) {
  //console.log(id)//測試看看事件是否綁定成功
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || [] //取目前在 local storage 的資料，放進收藏清單變數 list 
  const movie = movies.find((movie) => movie.id === id)
  if (list.some((movie) => movie.id === id)) {
    return alert('此電影已經在收藏清單中！')
  }
  list.push(movie)
  localStorage.setItem('favoriteMovies', JSON.stringify(list))
}

//9) 為移除按鈕加上事件監聽器: 當使用者點擊'X'按鈕時，這部電影將從清單中移出，讓使用者可以自行管理的收藏清單
//9.1) 在 X 按鈕的 HTML 元素上帶 id - refer to 2.4
//9.2) 修改 dataPanel 的監聽器，讓使用者點擊移除按鈕時，會觸發新的函式removeFromFavorite()， 並被傳入被點擊電影的 id。

//removeFromFavorite():

function removeFromFavorite(id) {
  //error handling: 收藏清單是空的，就結束這個函式
  if (!movies || !movies.length) return

  //透過 id 找到要刪除電影的 index
  const movieIndex = movies.findIndex((movie) => movie.id === id)
  //error handling: 一旦傳入的 id 在收藏清單中不存在，就結束這個函式
  if (movieIndex === -1) return

  //刪除該筆電影
  movies.splice(movieIndex, 1)

  //存回 local storage
  localStorage.setItem('favoriteMovies', JSON.stringify(movies))

  //更新頁面
  renderMovieList(movies)
}



