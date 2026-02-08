import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// API untuk kirim pesan WhatsApp via Fonnte
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: "Nomor telepon dan pesan harus diisi" },
        { status: 400 }
      );
    }

    // Format nomor telepon
    let formattedPhone = phoneNumber.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("62")) {
      formattedPhone = "62" + formattedPhone;
    }

    // Cek apakah Fonnte token tersedia
    const fonnteToken = process.env.FONNTE_TOKEN;
    
    if (!fonnteToken) {
      // Jika tidak ada token, fallback ke WhatsApp Web URL
      return NextResponse.json({
        success: false,
        fallback: true,
        whatsappUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`,
        message: "FONNTE_TOKEN tidak dikonfigurasi. Menggunakan WhatsApp Web.",
      });
    }

    // Kirim via Fonnte API
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: fonnteToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
        countryCode: "62",
      }),
    });

    const result = await response.json();

    if (result.status === true || result.status === "true") {
      return NextResponse.json({
        success: true,
        message: "Nota berhasil dikirim ke WhatsApp",
        detail: result,
      });
    } else {
      // Jika gagal, berikan fallback URL
      return NextResponse.json({
        success: false,
        fallback: true,
        whatsappUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`,
        message: result.reason || "Gagal mengirim via Fonnte. Silakan kirim manual.",
        detail: result,
      });
    }
  } catch (error) {
    console.error("Error sending WhatsApp:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengirim pesan" },
      { status: 500 }
    );
  }
}
