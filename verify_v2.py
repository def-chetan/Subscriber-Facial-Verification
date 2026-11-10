import os
import cv2
import json
from deepface import DeepFace

# Define your image paths
id_photo_path = "img/dadaid.jpg"
live_photo_path = "img/dadalive.jpg"

# Create a root folder to store cropped audit assets
output_folder = "extracted_faces"
os.makedirs(output_folder, exist_ok=True)

print("🔄 Initializing biometric core...")
print("🧬 Running 1:1 facial verification using ArcFace + RetinaFace...")

try:
    # Run verification using RetinaFace to handle caps, shadows, and occlusions
    result = DeepFace.verify(
        img1_path = id_photo_path,
        img2_path = live_photo_path,
        model_name = "ArcFace",
        detector_backend = "opencv",  # Upgraded brain for high accuracy
        enforce_detection = True
    )
    
    print("\n=========================================")
    print("         NTC e-KYC ENGINE OUTPUT         ")
    print("=========================================\n")
    print(json.dumps(result, indent=4))
    print("\n-----------------------------------------")
    
    # --- AUTOMATED FACE CROPPING LOGIC ---
    # Extract bounding box coordinates for the face on the ID Card (img1)
    face_data = result["facial_areas"]["img1"]
    x, y, w, h = face_data["x"], face_data["y"], face_data["w"], face_data["h"]
    
    # Read the original ID image, crop out the face array, and save it
    original_id_image = cv2.imread(id_photo_path)
    cropped_face = original_id_image[y:y+h, x:x+w]
    
    crop_save_path = os.path.join(output_folder, "cropped_id_face.jpg")
    cv2.imwrite(crop_save_path, cropped_face)
    print(f"📸 Audit Trail Saved: Extracted face archived to '{crop_save_path}'")
    # --------------------------------------

    if result["verified"]:
        print("✅ SUCCESS: Identity Confirmed.")
    else:
        print("❌ REJECTED: Identity Match Failed.")
    print("-----------------------------------------")

except Exception as e:
    print(f"\n⚠️ System Processing Error: {e}")