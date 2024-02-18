"use strict";

const MAX_HISTORY_NUM = 10
const KEY_LOCALSTORAGE_KEY_PREFIX = 'lgtn_history_img_'

const textPositionOffset = {
  top: [0, -100],
  middle: [0, 0],
  bottom: [0, 120],
}

const getHistoryKeys = () => {
  const imgHistoryKeys = []
  for (let i = 0; i < localStorage.length; i++) {
    const hkey = localStorage.key(i)
    hkey.startsWith(KEY_LOCALSTORAGE_KEY_PREFIX) && imgHistoryKeys.push(hkey)
  }
  imgHistoryKeys.sort()
  return imgHistoryKeys
}

const loadHistories = () => {
  const imgHistoryKeys = getHistoryKeys()
  const container = document.querySelector('#history-container')
  const template = document.querySelector('#history-template')
  imgHistoryKeys.forEach(item => {
    const t = template.cloneNode(true)
    t.attributes.id = item
    t.querySelector('img').src = localStorage.getItem(item)
    container.appendChild(t)
  })
}

const addHistory = (dataUrl) => {
  const timestamp = Date.now()
  localStorage.setItem(`${KEY_LOCALSTORAGE_KEY_PREFIX}${timestamp}`, dataUrl)
  const imgHistoryKeys = getHistoryKeys()
  while (imgHistoryKeys.length > MAX_HISTORY_NUM) {
    localStorage.removeItem(imgHistoryKeys[0])
  }
}

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
