'use strict'

$(function (){

  const setMessage = message => {
    const elem = document.querySelector("#paste-area-message")
    elem.textContent = message
  }

    // document.querySelector('#paste-area').addEventListener('paste', (event) => {
    document.addEventListener('paste', (event) => {

    event.preventDefault()

    if (!event.clipboardData
      || !event.clipboardData.types
      || (event.clipboardData.types.length != 1)
      || (event.clipboardData.types[0] != "Files")) {
        setMessage('ペーストされたデータが画像ではありません')
      return true;
    }
  
    setMessage('LGTN画像を生成しています...')

    generateLGTN(event.clipboardData.items[0])

  })

  const generateLGTN = async function(clipboardItem) {
    const imageFile = clipboardItem.getAsFile();
    const imgEl = document.querySelector("#pasted-image")
    const fr = new FileReader();
    fr.onload = function (e) {
      const base64 = e.target.result;
      imgEl.src = base64;
    };
    fr.readAsDataURL(imageFile);
    imgEl.addEventListener('load', drawCanvas)

  }

  const drawCanvas = function() {
    const imgEl = document.querySelector("#pasted-image")
    const selectedImageId = document.querySelector('input[name="chooseOverlay"]:checked').value
    const lgtnEl = document.querySelector(`#img__${selectedImageId}`)
    const canvas = document.querySelector('#output-image')
    const context = canvas.getContext('2d')

    // 画像のアスペクト比から描画する位置決めをする
    const imgWidth = imgEl.width
    const imgHeight = imgEl.height
    let drawX = 0
    let drawY = 0
    let drawWidth = canvas.width
    let drawHeight = canvas.height
    if(imgWidth > imgHeight) {
      // 横の方が長い場合、y座標側を調整する
      drawHeight = imgHeight * drawWidth / imgWidth
      drawY = (canvas.height - drawHeight) / 2
    } else {
      // 縦の方が長い場合、X座標側を調整する
      drawWidth = imgWidth * drawHeight / imgHeight
      drawX = (canvas.width - drawWidth) / 2
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    // context.drawImage(imgEl, 0, 0, canvas.width, canvas.height)
    context.drawImage(imgEl, drawX, drawY, drawWidth, drawHeight)
    context.drawImage(lgtnEl, 0, 0, canvas.width, canvas.height)
    copyImageToClipboard(canvas)
  }

  const copyImageToClipboard = (canvas) => {
    const pasteArea = document.querySelector('#paste-area')
    canvas.toBlob( blob => {
      const item = new ClipboardItem({ 'image/png': blob})
      navigator.clipboard.write([item])
        .then( () => {
          setMessage('クリップボードにLGTN画像がコピーされました！')
        })
        .catch( ex => {
          console.error(ex)
          setMessage('クリップボードの書き込み時にエラーが発生しました')
        })
    });

  }
})

