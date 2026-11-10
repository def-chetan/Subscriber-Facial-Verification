import os
import cv2
import json
import numpy as np
import streamlit as st
from deepface import DeepFace

# Set up clean page aesthetics for Nepal Telecom presentation
st.set_page_config(page_title="NTC Biometric e-KYC Portal", layout="wide")

st.title("🇳🇵 Nepal Telecom — Point of Sale Biometric e-KYC")
st.subheader("Automated 1:1 Facial Verification Engine")
st.write("---")

# Ensure directory for audit trails exists
CROP_DIR = "extracted_faces"
os.makedirs(CROP_DIR, exist_ok=True)

# Layout Split: Two columns for data input
col1, col2 = st.columns(2)

with col1:
    st.header("1. Document Ingestion")
    uploaded_id = st.file_uploader("Upload Citizen ID Card / Passport Photo", type=["png", "jpg", "jpeg"])
    if uploaded_id:
        st.image(uploaded_id, caption="Target Identification Card", width=350)

with col2:
    st.header("2. Live Capture Validation")
    live_capture = st.camera_input("Take Live Verification Photograph")

# Core Verification Trigger Sequence
if uploaded_id and live_capture:
    st.write("---")
    st.info("🔄 Re-aligning neural grids and analyzing structural nodes via RetinaFace backend...")
    
    try:
        # Save uploaded streams as temporary physical files for DeepFace ingestion
        id_temp_path = "Passportcopy.jpg"
        live_temp_path = "chetan_live.jpg"
        
        with open(id_temp_path, "wb") as f:
            f.write(uploaded_id.getbuffer())
        with open(live_temp_path, "wb") as f:
            f.write(live_capture.getbuffer())
            
        # Execute analysis using RetinaFace to easily overcome cap/headwear occlusions
        result = DeepFace.verify(
            img1_path = id_temp_path,
            img2_path = live_temp_path,
            model_name = "ArcFace",
            detector_backend = "opencv",  # Upgraded brain for caps/occlusions
            enforce_detection = True
        )
        
        # --- Face Slicing & Saving Automations ---
        # Parse face dimensions extracted from image 1 (ID card)
        face_coords = result["facial_areas"]["img1"]
        x, y, w, h = face_coords["x"], face_coords["y"], face_coords["w"], face_coords["h"]
        
        # Read the raw ID image array, crop out the face matrix, and write to folder
        raw_id_image = cv2.imread(id_temp_path)
        cropped_face_matrix = raw_id_image[y:y+h, x:x+w]
        
        saved_crop_path = os.path.join(CROP_DIR, "cropped_id_face.jpg")
        cv2.imwrite(saved_crop_path, cropped_face_matrix)
        # ----------------------------------------
        
        # Presentation Dashboard Outputs
        res_col1, res_col2 = st.columns([1, 2])
        
        with res_col1:
            st.metric(label="Calculated Vector Distance", value=f"{result['distance']:.4f}")
            st.metric(label="System Confidence Score", value=f"{result['confidence']:.2f}%")
            st.image(saved_crop_path, caption="Cropped Face Extracted & Saved to Database")
            
        with res_col2:
            if result["verified"]:
                st.success("### ✅ MATCH CONFIRMED\nThis individual matches the historical record on the scanned document.")
            else:
                st.error("### ❌ ACCESS DENIED / MISMATCH\nThe live physical subject does not display matching features with this ID record.")
                
            with st.expander("View Raw Diagnostic JSON Matrix"):
                st.json(result)
                
        # Internal file system cleanup
        os.remove(id_temp_path)
        os.remove(live_temp_path)

    except Exception as e:
        st.error(f"Execution Error: {e}")
        st.warning("Ensure the person's face is clearly visible to the lens without extreme angles.")
