'use strict'

$(function (){
  document.querySelector('#paste-area').addEventListener('paste', (event) => {

    event.preventDefault()
    if (!event.clipboardData
      || !event.clipboardData.types
      || (event.clipboardData.types.length != 1)
      || (event.clipboardData.types[0] != "Files")) {
      return true;
    }
  
    const imageFile = event.clipboardData.items[0].getAsFile();
    const imgEl = document.querySelector("#pasted-image")
    const fr = new FileReader();
    fr.onload = function (e) {
      const base64 = e.target.result;
      imgEl.src = base64;
    };
    fr.readAsDataURL(imageFile);
    imgEl.addEventListener('load', drawCanvas)
  })

  const drawCanvas = function() {
    const imgEl = document.querySelector("#pasted-image")
    const lgtnEl = document.querySelector("#img__lgtn")
    const canvas = document.querySelector('#output-image')
    const context = canvas.getContext('2d')

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(imgEl, 0, 0, canvas.width, canvas.height)
    context.drawImage(lgtnEl, 0, 0, canvas.width, canvas.height)
  }
})

