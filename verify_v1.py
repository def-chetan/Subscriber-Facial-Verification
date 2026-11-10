import json
from deepface import DeepFace

# Define the paths to your local test images
id_photo_path = "4.png"
live_photo_path = "chetan_live.jpg"

print("🔄 Initializing biometric core...")
print("🧬 Running 1:1 facial verification using ArcFace engine...")

try:
    # DeepFace will automatically download the ArcFace weights on its first run
    result = DeepFace.verify(
        img1_path = id_photo_path,
        img2_path = live_photo_path,
        model_name = "ArcFace",
        detector_backend = "opencv",
        enforce_detection = True
    )
    
    print("\n=========================================")
    print("         NTC e-KYC ENGINE OUTPUT         ")
    print("=========================================\n")
    
    # Print the raw mathematical results beautifully
    print(json.dumps(result, indent=4))
    
    print("\n-----------------------------------------")
    # Final decision logic based on the calculated metric
    if result["verified"]:
        print("✅ SUCCESS: Identity Confirmed.")
        print(f"The live subject matches the historical ID photo.")
    else:
        print("❌ REJECTED: Identity Match Failed.")
        print("The face structural distance exceeds the security threshold.")
    print("-----------------------------------------")

except Exception as e:
    print(f"\n⚠️ System Processing Error: {e}")
    print("Ensure both images exist in the folder and contain a clear face.")