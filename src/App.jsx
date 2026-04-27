import React, { useRef, useState } from "react";

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function downscaleImageFile(file, maxSize = 960, quality = 0.72) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );

  return new File([blob], "ocr.jpg", { type: "image/jpeg" });
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    color: "#e2e8f0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial",
  },
  button: {
    width: "220px",
    height: "220px",
    fontSize: "32px",
    fontWeight: 900,
    borderRadius: "20px",
    background: "#0369a1",
    color: "white",
    border: "1px solid #0ea5e9",
    cursor: "pointer",
  },
  answer: {
    marginTop: "20px",
    fontSize: "28px",
    fontWeight: 800,
    textAlign: "center",
  },
};

export default function App() {
  const inputRef = useRef();
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoto = async (file) => {
    try {
      setLoading(true);
      setAnswer("...");

      const resized = await downscaleImageFile(file);
      const base64 = await fileToBase64(resized);

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: resized.type,
          photoKey: new URLSearchParams(window.location.search).get("photo_key"),
        }),
      });

      const data = await res.json();
      setAnswer(data.answer || "No answer");
    } catch (e) {
      console.error(e);
      setAnswer("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div>
        <button
          style={styles.button}
          onClick={() => inputRef.current.click()}
        >
          {loading ? "..." : "PHOTO"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => handlePhoto(e.target.files[0])}
        />

        {answer && <div style={styles.answer}>{answer}</div>}
      </div>
    </div>
  );
}