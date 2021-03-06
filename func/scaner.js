
const path = require('path') //系统路径模块
const fs = require('fs') //文件模块
const request = require('request')

let TODAY_LUNAR = null

// 获取今日农历信息
function getTodayLunar () {
  const opt = {
    url: 'https://www.sojson.com/open/api/lunar/json.shtml',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
    }
  }
  return new Promise((resolve, reject) => {
    request.get(opt, (err, res, body) => {
      if (!err && res.statusCode == 200) {
        TODAY_LUNAR = JSON.parse(body)
        resolve()
      } else {
        console.log(err)
      }
    })
  })
}

// 读取json文件
function getData() {
  return new Promise((resolve, reject) => {
    const file = path.join(__dirname, '../data/data.json')
    fs.readFile(file, 'utf-8', function(err, data) {
      if (err) {
        console.log(err)
      } else {
        resolve(data)
      }
    })
  })
}

/* 判断两个日期差 
*  @da = [12, 31],
*  @db = [1, 3]
*  ruturn 4
*/
function dateDiff(today, birth) {
  let diff = 999
  if (birth[0] === today[1]) {
    diff = birth[1] - today[2]
  } else if ((birth[0] - today[1] === 1) || (birth[0] === 1 && today[1] === 12)) {
    // 隔月 or 隔年
    const now = new Date(today[0], today[1]-1, today[2])
    let birthDay = new Date(today[0], birth[0]-1, birth[1])
    if (today[1] === 12) { // 隔年+1
      birthDay = new Date(today[0] + 1, birth[0]-1, birth[1])
    }
    diff = parseInt((birthDay - now) / 1000 / 60 /60 / 24)
  }
  return diff
}

// 返回生日
function nextBirthday(birth, type = 0) {
  return new Promise((resolve, reject) => {
    const birthArr = birth.split('/')
    const m = parseInt(birthArr[1])
    const d = parseInt(birthArr[2])
    // 获取今日公历or农历
    const today = type === 0 ?
      [(new Date()).getFullYear(),TODAY_LUNAR.data.lunarMonth, TODAY_LUNAR.data.lunarDay]
      :
      [(new Date()).getFullYear(), (new Date()).getMonth() +1, (new Date()).getDate()]
    resolve(dateDiff(today, [m, d]))
  })
}

// 扫描器
async function scaner() {
  await getTodayLunar()
  const list = JSON.parse(await getData())
  let result = []
  for (const item of list) {
    const n = await nextBirthday(item.birth, item.type)
    if (n > -1 && n < 8) {
      // '@ ， 。 . 卐 _'
      result.push({
        name: item.name,
        day: n,
        msg: `@${item.name}_${n || '今'}天`
      })
    }
  }
  result = result.sort((a, b) => a.day - b.day)
  return result
}

module.exports = scaner