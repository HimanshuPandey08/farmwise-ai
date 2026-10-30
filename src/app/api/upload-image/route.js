import { auth } from "@/lib/auth";


import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(request) {

  try {
    const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in first." },
      { status: 401 }
    );
}
    // 1. Verify Cloudinary credentials
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Cloudinary is not configured." },
        { status: 500 }
      );
    }

    // 2. Read the uploaded image
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "Please provide an image." },
        { status: 400 }
      );
    }

    // 3. Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image size must be between 1 byte and 5 MB." },
        { status: 400 }
      );
    }

    // 5. Convert image to a Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 6. Determine target folder based on uploadType
    const uploadType = formData.get("uploadType") || "diagnosis";
    const targetFolder =
      uploadType === "listing" || uploadType === "marketplace"
        ? "farmwise/marketplace-listings"
        : "farmwise/crop-images";

    // 7. Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: targetFolder,
          resource_type: "image",
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
          } else {
            resolve(uploadResult);
          }
        }
      );

      stream.end(buffer);
    });

    const secureUrl = result.secure_url;
    const thumbnailUrl = secureUrl.includes("/upload/")
      ? secureUrl.replace("/upload/", "/upload/c_fill,w_400,h_300,q_auto,f_auto/")
      : secureUrl;

    // 8. Return uploaded image URLs
    return NextResponse.json({
      secureUrl,
      thumbnailUrl,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Image upload failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
