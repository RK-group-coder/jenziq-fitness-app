/**
 * 建立 Image 物件
 */
export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous') // 預防跨域問題
        image.src = url
    })

/**
 * 取得裁切後的圖片 Blob
 */
export async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    // 設置畫布大小為裁切後的大小
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // 將裁切的部分畫到畫布上
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    // 回傳 Blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            if (file) {
                resolve(file)
            } else {
                reject(new Error('Canvas is empty'))
            }
        }, 'image/jpeg')
    })
}
