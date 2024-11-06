from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uuid import uuid4
from dotenv import load_dotenv
import qrcode
import fitz  # PyMuPDF
import os
import shutil
from pathlib import Path
from PIL import Image

print(fitz.__doc__)
if hasattr(fitz, 'open'):
    print("fitz is available, and the open function exists.")
else:
    print("fitz is available, but open function is missing.")
load_dotenv()

app = FastAPI()

# Allowed origins (update this with your frontend's URL)
origins = [
    "https://v10fwg0x-3001.inc1.devtunnels.ms",  # Frontend origin
    "http://localhost:3000",                     # Local development (optional)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # Allows specific origins
    allow_credentials=True,
    allow_methods=["*"],            # Allows all HTTP methods
    allow_headers=["*"],            # Allows all headers
)


UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)

class UploadResponse(BaseModel):
    message: str
    documentId: str
    downloadUrl: str

class LoginRequest(BaseModel):
    username: str
    password: str

def generate_qr_code(data: str) -> Path:
    qr = qrcode.QRCode(border=0, box_size=4)

    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill="black", back_color="white")
    
    # Define the path where the QR code image will be saved
    qr_path = UPLOAD_FOLDER / "qr_code.png"
    
    # Save the QR code image
    img.save(qr_path)
    
    # Check if the file was saved successfully
    if qr_path.exists():
        print(f"QR code saved at: {qr_path}")
    else:
        print("Failed to save the QR code.")
    
    return qr_path


def add_qr_to_pdf(pdf_path: Path, qr_path: Path, output_path: Path):
    # Open the original PDF with PyMuPDF
    pdf_document = fitz.open(str(pdf_path))

    # Read the QR code image file in binary mode
    with open(qr_path, "rb") as qr_file:
        qr_image_bytes = qr_file.read()

    # Add QR code to each page without modifying existing text (preserves Arabic)
    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]
        rect = page.rect
        page_width = rect.width  # Width of the page
        page_height = rect.height  # Height of the page
        square_size = 70.875  # Desired side length of the square

        # Calculate the centered rectangle
        left = ((page_width - square_size) / 2) - 5
        top = ((page_height - square_size) / 2) + 322
        right = left + square_size + 10
        bottom = top + square_size + 10.3

        qr_rect = fitz.Rect(left, top, right, bottom)
        page.insert_image(qr_rect, stream=qr_image_bytes)  # Insert the QR code as an image

    # Save the modified PDF with the QR code added
    pdf_document.save(str(output_path))
    pdf_document.close()

@app.post("/api/upload/pdf", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    document_id = str(uuid4())
    verification_url = f"https://v10fwg0x-3001.inc1.devtunnels.ms/verify/{document_id}"
    print(f"https://v10fwg0x-3001.inc1.devtunnels.ms/verify/{document_id}")
    qr_path = generate_qr_code(verification_url)
    
    input_pdf_path = UPLOAD_FOLDER / f"{document_id}_input.pdf"
    output_pdf_path = UPLOAD_FOLDER / f"{document_id}_output.pdf"
    
    # Save uploaded PDF in binary mode to preserve content (including Arabic text)
    with input_pdf_path.open("wb") as pdf_file:
        shutil.copyfileobj(file.file, pdf_file)

    # Add QR code to the PDF (preserves existing Arabic text)
    add_qr_to_pdf(input_pdf_path, qr_path, output_pdf_path)

    # Clean up the original file and QR code image
    input_pdf_path.unlink()
    qr_path.unlink()
    print(document_id)
    return UploadResponse(
        message="File uploaded and QR code added",
        documentId=document_id,
        downloadUrl=f"/api/download/{document_id}"
    )

@app.get("/api/download/{document_id}")
async def download_pdf(document_id: str):
    output_pdf_path = UPLOAD_FOLDER / f"{document_id}_output.pdf"
    if not output_pdf_path.exists():
        raise HTTPException(status_code=404, detail="Document not found")
    return FileResponse(path=output_pdf_path, filename=f"{document_id}.pdf")

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    if request.username == os.getenv("ADMIN_USERNAME") and request.password == os.getenv("ADMIN_PASSWORD"):
        return {"token": os.getenv("ADMIN_TOKEN")}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")