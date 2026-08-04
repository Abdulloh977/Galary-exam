import axios from "axios";
import FormData from "form-data";

export const uploadToImgBB = async (file) => {
    const form = new FormData();
    form.append("image", file.data.toString("base64"));

    const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
        form,
        { headers: form.getHeaders() }
    );

    if (response.data && response.data.success) {
        return response.data.data.url;
    }

    throw new Error("Rasmni ImgBB'ga yuklashda xatolik yuz berdi");
};