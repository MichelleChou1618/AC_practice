const BASE_URL = 'https://webdev.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const movies = []
const MOVIES_PER_PAGE = 12 //每頁只顯示 12 筆資料
let filteredMovies = [] //用於做搜尋結果分頁器使用

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
const dataPanel = document.querySelector('#data-panel')

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
          <button class="btn btn-info btn-add-favorite" data-id=${item.id}>+</button>
        </div>
      </div>
    </div>
  </div>`
  })
  dataPanel.innerHTML = rawHTML
}

//3) 調用函式:
//請在 axios 程式碼中的 then() 中呼叫它，並把 movies 傳進去
//串接 Index API 拿到總清單 movies 以後 ，不要一口氣全部輸出，只要顯示第 1 頁的資料就好 : 測試getMoviesByPage() 結果
//取得 Index API 資料之後，呼叫 renderPaginator()，並傳入資料的總筆數
axios
  .get(INDEX_URL)
  .then((response) => {
    movies.push(...response.data.results)
    //renderMovieList(movies) //新增這裡
    renderPaginator(movies.length)
    renderMovieList(getMoviesByPage(1))
  })
  .catch((err) => console.log(err))

// 4) 委派點擊事件
// 監聽 data panel
dataPanel.addEventListener('click', function onPanelClicked(event) {
  if (event.target.matches('.btn-show-movie')) {
    // console.log(event.target.dataset.id) - 檢查是否有監聽到dataPanel
    showMovieModal(Number(event.target.dataset.id)) //refer to 6.2
  } else if (event.target.matches('.btn-add-favorite')) {
    addToFavorite(Number(event.target.dataset.id)) //refer to 8.2
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
  //let filteredMovies = []//將local variable 變成 global variable, 用於paginator使用
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

  //重製分頁器 - refer to 11.2)
  renderPaginator(filteredMovies.length)

  // 7.4) 將匹配結果回傳到網頁畫面上
  //renderMovieList(filteredMovies)
  //預設顯示第 1 頁的搜尋結果
  renderMovieList(getMoviesByPage(1))


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

//10) 實作分頁:
//10.1) 目標: 每頁只顯示 12 筆資料
//10.2) 分頁功能是：「依照被點擊到的頁碼，決定需要的資料範圍，顯示在畫面上。」
//拆解問題:
//10.3) 根據資料長度，計算出總頁碼，製作分頁器 UI 元件: renderPaginator()
//10.4) 監聽分頁器的點擊事件
//10.5) 根據被點擊的頁數，取出一部分的電影資料: getMoviesByPage()
//10.6) 將取出的部分資料呈現在畫面(data - panel) 上: renderMovieList()


//getMoviesByPage(): 負責從總清單裡切割資料, 然後回傳切割好的新陣列
function getMoviesByPage(page) {

  //如果搜尋清單有東西，就取搜尋清單 filteredMovies，否則就還是取總清單 movies - refer to 11.1)
  const data = filteredMovies.length ? filteredMovies : movies
  //計算起始 index 
  const startIndex = (page - 1) * MOVIES_PER_PAGE
  //回傳切割後的新陣列
  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE)
}

//renderPaginator(): 計算總頁數, 製作同樣數量的 li.page-item，並重新渲染到 template 裡
function renderPaginator(amount) {
  //計算總頁數
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE)
  //製作 template 
  let rawHTML = ''

  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`
  }//在每個a 標籤中，加上 data - page 屬性來標注頁數，方便後續取用頁碼。
  //放回 HTML
  paginator.innerHTML = rawHTML
}

//10.4)新增 Pagination 標籤的事件監聽器

const paginator = document.querySelector('#paginator')
paginator.addEventListener('click', function onPaginatorClicked(event) {
  //如果被點擊的不是 a 標籤，結束
  if (event.target.tagName !== 'A') return

  //透過 dataset 取得被點擊的頁數
  const page = Number(event.target.dataset.page)
  //更新畫面
  renderMovieList(getMoviesByPage(page))
})

//11) 搜尋結果也要分頁: 搜尋這個動作，對畫面造成的影響是：從無條件顯示全部資料，變成只顯示搜尋清單 filteredMovies 裡的資料。
 //getMoviesByPage 的處理對象會從 movies 變成 filteredMovies - 11.1) 修改資料來源
//而分頁器的長度，則是根據 filteredMovies 的長度來決定 - 11.2) 修改搜尋監聽器



