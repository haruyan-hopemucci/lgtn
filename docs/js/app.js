"use strict";

const MAX_HISTORY_NUM = 10
const KEY_LOCALSTORAGE_KEY_PREFIX = 'lgtn_history_img'

const textPositionOffset = {
  top: [0, -100],
  middle: [0, 0],
  bottom: [0, 120],
}

const loadHistoriesAsync = () => {
  const imgHistories = []
  const startIndex = loadImgHistoryStartIndex()
  for( let i = 0; i < MAX_HISTORY_NUM; i++){
    const num = (startIndex - i + MAX_HISTORY_NUM) % MAX_HISTORY_NUM
    imgHistories.push(loadImgHistory(num))
  }
  // TODO: history領域に画像をセットする処理など
  console.log(imgHistories)
}

const loadImgHistoryStartIndex = () => 
  localStorage.getItem(`${KEY_LOCALSTORAGE_KEY_PREFIX}_index`) || 0

const loadImgHistory(num) = () =>
  localStorage.getItem(`${KEY_LOCALSTORAGE_KEY_PREFIX}_${num}`)

const savaImgHistoryStartIndex = (value) =>
  localStorage.setItem(`${KEY_LOCALSTORAGE_KEY_PREFIX}_index`, value)

const saveImgHistory(num, value) = () =>
  localStorage.getItem(`${KEY_LOCALSTORAGE_KEY_PREFIX}_${num}`, value)

$(function () {
  var gCanvas = document.querySelector("canvas#output-image");
  var gPastedImage = document.querySelector("img#pasted-image");
  const selectedOverlayImageValue = () =>
    document.querySelector('input[name="chooseOverlay"]:checked').value;
  const getOverlayImage = () => document.querySelector(`img#img__${selectedOverlayImageValue()}`);
  const getTextPosition = () => document.querySelector('input[name="textPosition"]:checked').value
  const setMessage = (message) => {
    const elem = document.querySelector("#paste-area-message");
    elem.textContent = message;
  };

  $('input[name="chooseOverlay"], input[name="textPosition"]').on("change", (event) => {
    if (gPastedImage.src) {
      setMessage(`${selectedOverlayImageValue()}画像を再生成しています...`);
      redrawLgtnImage();
    }
  });

  document.addEventListener("paste", (event) => {
    event.preventDefault();

    if (
      !event.clipboardData ||
      !event.clipboardData.types ||
      event.clipboardData.types.length != 1 ||
      event.clipboardData.types[0] != "Files"
    ) {
      setMessage("ペーストされたデータが画像ではありません");
      return true;
    }
    setMessage("LGTN画像を生成しています...");
    const fileType = event.clipboardData.items[0].type
    switch (fileType) {
      case 'image/heic':
        convertHeicToPng(event.clipboardData.items[0])
        break
      case 'image/png':
      case 'image/jpeg':
        generateLGTN(event.clipboardData.items[0])
        break
      default:
        setMessage("未対応の画像形式です。");
    }
  });

  const convertHeicToPng = async function (clipboardItem) {
    const imageFile = clipboardItem.getAsFile();
    const conversionResult = await heic2any({ blob: imageFile })
    const dataUrl = URL.createObjectURL(conversionResult)
    const imgEl = document.querySelector("#pasted-image");
    imgEl.addEventListener("load", drawCanvas);
    imgEl.src = dataUrl;
  }

  const generateLGTN = async function (clipboardItem) {
    const imageFile = clipboardItem.getAsFile();
    const imgEl = document.querySelector("#pasted-image");
    const fr = new FileReader();
    fr.onload = function (e) {
      const base64 = e.target.result
      imgEl.src = base64;
    };
    fr.readAsDataURL(imageFile);
    imgEl.addEventListener("load", drawCanvas);
  };

  const drawCanvas = function () {
    const imgEl = gPastedImage
    const selectedImageId = selectedOverlayImageValue();
    const lgtnEl = getOverlayImage()
    const canvas = gCanvas
    const context = canvas.getContext("2d");

    // 画像のアスペクト比から描画する位置決めをする
    const imgWidth = imgEl.width;
    const imgHeight = imgEl.height;
    let drawX = 0;
    let drawY = 0;
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    if (imgWidth > imgHeight) {
      // 横の方が長い場合、y座標側を調整する
      drawHeight = (imgHeight * drawWidth) / imgWidth;
      drawY = (canvas.height - drawHeight) / 2;
    } else {
      // 縦の方が長い場合、X座標側を調整する
      drawWidth = (imgWidth * drawHeight) / imgHeight;
      drawX = (canvas.width - drawWidth) / 2;
    }
    
    // テキスト描画位置の決定
    const [drawTextX, drawTextY] = textPositionOffset[getTextPosition()]
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(imgEl, drawX, drawY, drawWidth, drawHeight);
    context.drawImage(lgtnEl, drawTextX, drawTextY, canvas.width, canvas.height);
    copyImageToClipboard(canvas);
  };

  const copyImageToClipboard = (canvas) => {
    const pasteArea = document.querySelector("#paste-area");
    canvas.toBlob((blob) => {
      const item = new ClipboardItem({ "image/png": blob });
      navigator.clipboard
        .write([item])
        .then(() => {
          setMessage(
            `クリップボードに${selectedOverlayImageValue()}画像がコピーされました！`
          );
        })
        .catch((ex) => {
          console.error(ex);
          setMessage("クリップボードの書き込み時にエラーが発生しました");
        });
    });
  };

  const redrawLgtnImage = () => {
    drawCanvas();
  };
});
