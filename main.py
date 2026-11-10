import os
import cv2
import base64
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace

app = FastAPI(title="Nepal Telecom e-KYC Biometric Core")

# Enable Cross-Origin Resource Sharing (CORS) to safely link port 5173 to port 8000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your React dev server address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = "extracted_faces"
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/verify")
async def verify_identity(id_card: UploadFile = File(...), live_capture: UploadFile = File(...)):
    try:
        # 1. Read binary files arriving from the browser network and convert to NumPy image matrices
        id_bytes = await id_card.read()
        live_bytes = await live_capture.read()
        
        nparr_id = np.frombuffer(id_bytes, np.uint8)
        nparr_live = np.frombuffer(live_bytes, np.uint8)
        
        img_id = cv2.imdecode(nparr_id, cv2.IMREAD_COLOR)
        img_live = cv2.imdecode(nparr_live, cv2.IMREAD_COLOR)
        
        if img_id is None or img_live is None:
            raise HTTPException(status_code=400, detail="Invalid image file matrix received.")

        # 2. Temporary storage pointers required for DeepFace processing
        temp_id_path = "backend_temp_id.jpg"
        temp_live_path = "backend_temp_live.jpg"
        cv2.imwrite(temp_id_path, img_id)
        cv2.imwrite(temp_live_path, img_live)

        # 3. Execute core 1:1 biometric comparison calculation (OpenCV + ArcFace)
        result = DeepFace.verify(
            img1_path = temp_id_path,
            img2_path = temp_live_path,
            model_name = "ArcFace",
            detector_backend = "opencv",
            enforce_detection = True
        )

        # 4. Extract face coordinates found on the ID document via OpenCV
        face_coords = result["facial_areas"]["img1"]
        x, y, w, h = face_coords["x"], face_coords["y"], face_coords["w"], face_coords["h"]
        
        # Crop the face matrix out of the original ID document file array
        cropped_face = img_id[y:y+h, x:x+w]
        
        # Save a backup physical asset into our local project root folder
        crop_disk_path = os.path.join(OUTPUT_DIR, "cropped_id_face.jpg")
        cv2.imwrite(crop_disk_path, cropped_face)

        # 5. Convert the raw cropped image pixels into a safe Base64 string for direct browser rendering
        _, buffer = cv2.imencode('.jpg', cropped_face)
        base64_face_string = base64.b64encode(buffer).decode('utf-8')

        # Clean local temporary file footprints completely
        if os.path.exists(temp_id_path): os.remove(temp_id_path)
        if os.path.exists(temp_live_path): os.remove(temp_live_path)

        # Send the authentic computed values straight back to the React UI
        return {
            "verified": bool(result["verified"]),
            "distance": float(result["distance"]),
            "confidence": float(result["confidence"]),
            "cropped_face_b64": f"data:image/jpeg;base64,{base64_face_string}"
        }

    except Exception as e:
        # Gracefully cleanup loose files if the neural pipelines throw an identity detection exception
        if os.path.exists("backend_temp_id.jpg"): os.remove("backend_temp_id.jpg")
        if os.path.exists("backend_temp_live.jpg"): os.remove("backend_temp_live.jpg")
        raise HTTPException(status_code=500, detail=str(e))