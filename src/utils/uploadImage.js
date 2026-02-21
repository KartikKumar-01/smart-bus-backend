import cloudinary from "../config/cloudinary.js";

const uploadImage = async (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "smart-bus" },
      (err, result) => {
        if (err) {
          const customError = new Error("File not uploaded.");
          customError.statusCode = 500;
          return reject(customError); 
        }
        resolve({
          message: "Image uploaded successfully.",
          image_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );
    stream.end(file.buffer);
  });
};

export default uploadImage