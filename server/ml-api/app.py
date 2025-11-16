"""
Flask REST API for Voice Command ML Prediction

Serves the trained scikit-learn model via HTTP endpoint.

Endpoint:
    POST /predict
    Body: {"text": "bring gloves to Room A1"}
    Response: {
        "intent": "delivery",
        "confidence": 0.95,
        "supplies": ["Gloves"],
        "destination": "Room A1",
        "priority": "NORMAL"
    }

Usage:
    python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import re
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for client access

# Load model on startup
MODEL_PATH = Path(__file__).parent / 'model.pkl'
model = None

def load_model():
    """Load trained scikit-learn model"""
    global model
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        print(f'✅ Model loaded from {MODEL_PATH}')
    except Exception as e:
        print(f'❌ Failed to load model: {e}')
        model = None

# Medical supply dictionary for extraction
MEDICAL_SUPPLIES = [
    'syringes', 'bandages', 'morphine', 'gloves', 'antiseptic', 
    'gauze', 'thermometer', 'masks', 'gown', 'needles',
    'iv bags', 'iv fluids', 'saline', 'oxygen', 'tubing'
]

# Rooms/locations
LOCATIONS = [
    'room a1', 'room a2', 'room a3', 'room b1', 'room b2',
    'icu', 'emergency room', 'er', 'supply room', 'pharmacy', 'storage'
]

def extract_features(text):
    """Extract structured features from command text"""
    text_lower = text.lower()
    
    features = {
        'supplies': [],
        'destination': None,
        'priority': 'NORMAL'
    }
    
    # Extract supplies
    for supply in MEDICAL_SUPPLIES:
        if supply in text_lower:
            # Capitalize properly
            if supply == 'iv bags':
                features['supplies'].append('IV Bags')
            elif supply == 'iv fluids':
                features['supplies'].append('IV Fluids')
            else:
                features['supplies'].append(supply.title())
    
    # Extract destination
    for location in LOCATIONS:
        if location in text_lower:
            # Capitalize properly
            if location == 'icu':
                features['destination'] = 'ICU'
            elif location == 'er':
                features['destination'] = 'Emergency Room'
            else:
                features['destination'] = location.title()
            break
    
    # Detect priority
    urgent_keywords = ['urgent', 'asap', 'emergency', 'stat', 'immediately', 'critical']
    low_keywords = ['low priority', 'whenever', 'later', 'when convenient']
    
    if any(word in text_lower for word in urgent_keywords):
        features['priority'] = 'URGENT'
    elif any(word in text_lower for word in low_keywords):
        features['priority'] = 'LOW'
    
    return features

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict intent and extract features from voice command"""
    if not model:
        return jsonify({
            'error': 'Model not loaded'
        }), 500
    
    try:
        # Get input text
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'error': 'Missing "text" field in request body'
            }), 400
        
        text = data['text']
        text_lower = text.lower()
        
        # Predict intent
        intent = model.predict([text_lower])[0]
        
        # Get confidence (probability)
        proba = model.predict_proba([text_lower])[0]
        confidence = float(max(proba))
        
        # Extract features
        features = extract_features(text)
        
        # Build response
        response = {
            'intent': intent,
            'confidence': confidence,
            'supplies': features['supplies'],
            'destination': features['destination'],
            'priority': features['priority']
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Predict multiple commands at once"""
    if not model:
        return jsonify({
            'error': 'Model not loaded'
        }), 500
    
    try:
        data = request.get_json()
        if not data or 'texts' not in data:
            return jsonify({
                'error': 'Missing "texts" field in request body'
            }), 400
        
        texts = data['texts']
        results = []
        
        for text in texts:
            text_lower = text.lower()
            intent = model.predict([text_lower])[0]
            proba = model.predict_proba([text_lower])[0]
            confidence = float(max(proba))
            features = extract_features(text)
            
            results.append({
                'text': text,
                'intent': intent,
                'confidence': confidence,
                'supplies': features['supplies'],
                'destination': features['destination'],
                'priority': features['priority']
            })
        
        return jsonify({'results': results})
    
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

if __name__ == '__main__':
    import os
    
    # Load model
    load_model()
    
    # Get port from environment or default to 5001
    port = int(os.environ.get('PORT', 5001))
    
    # Run server
    print('=' * 80)
    print('🚀 ML API Server Starting')
    print('=' * 80)
    print('Endpoints:')
    print('  GET  /health        - Health check')
    print('  POST /predict       - Single prediction')
    print('  POST /batch-predict - Batch predictions')
    print('=' * 80)
    print(f'Port: {port}')
    print('=' * 80)
    
    app.run(host='0.0.0.0', port=port, debug=False)
