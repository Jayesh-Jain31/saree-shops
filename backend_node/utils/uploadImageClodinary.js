import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME || process.env.CLODINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY || process.env.CLODINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET_KEY || process.env.CLODINARY_API_SECRET_KEY,
    secure: true,
})

const uploadImageClodinary = async(image)=>{
    const buffer = image?.buffer || Buffer.from(await image.arrayBuffer())

    const uploadImage = await new Promise((resolve,reject)=>{
        cloudinary.uploader.upload_stream({ folder : "binkeyit"},(error,uploadResult)=>{
            if(error){
                console.log("Cloudinary upload error:", error)
                return reject(error)
            }
            return resolve(uploadResult)
        }).end(buffer)
    })

    return uploadImage
}

export default uploadImageClodinary
