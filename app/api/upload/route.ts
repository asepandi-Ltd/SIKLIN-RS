import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.includes('/rest/v1') ? rawUrl.split('/rest/v1')[0] : rawUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  return supabaseUrl.startsWith("https://") && 
         !supabaseUrl.includes("placeholder") &&
         !supabaseUrl.includes("YOUR_") &&
         !supabaseUrl.includes("MY_");
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Tidak ada file yang diunggah" },
        { status: 400 }
      );
    }

    // Validate size (10 MB = 10 * 1024 * 1024 bytes)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Kapasitas file maksimal adalah 10 MB" },
        { status: 400 }
      );
    }

    // Validate type
    const allowedTypes = [
      "image/jpeg", 
      "image/png", 
      "image/jpg", 
      "video/mp4",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = ["jpg", "jpeg", "png", "mp4", "pdf", "xlsx", "xls"];

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: "Format file harus berupa JPG, PNG, MP4, PDF, atau Excel" },
        { status: 400 }
      );
    }

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save locally first (always act as a reliable fallback/local copy)
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename to avoid collision
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}.${ext}`;
    const filePath = join(uploadDir, filename);

    // Save the file to public/uploads
    await writeFile(filePath, buffer);

    // Default local file URL served by Next.js
    let fileUrl = `/uploads/${filename}`;
    let isUploadedToSupabase = false;

    // Try uploading to Supabase Storage bucket "uploads"
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
        
        const { data, error } = await supabase.storage
          .from("uploads")
          .upload(filename, buffer, {
            contentType: file.type || undefined,
            cacheControl: "3600",
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from("uploads")
            .getPublicUrl(filename);

          if (publicUrlData?.publicUrl) {
            fileUrl = publicUrlData.publicUrl;
            isUploadedToSupabase = true;
            console.log("Uploaded successfully to cloud storage:", fileUrl);
          }
        } else {
          console.log("Supabase Storage fallback: saved to local folder.");
        }
      } catch (err) {
        console.log("Supabase Storage fallback: exception handled, saved to local folder.");
      }
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: file.name,
      size: file.size,
      storageType: isUploadedToSupabase ? "supabase" : "local",
    });
  } catch (error: any) {
    console.log("Upload handler exception: processing fallback completed.", error?.message);
    return NextResponse.json(
      { error: error.message || "Gagal mengunggah file ke server" },
      { status: 500 }
    );
  }
}
