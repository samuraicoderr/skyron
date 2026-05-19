# Product Requirements Document (PRD) - V1

**Project Title:** Music Genre Classification System  
**Version:** V1.0  
**Date:** May 19, 2026  
**Author:** KING-AYINDE OBANLALOLORUN JEDIDIAH (SEN/20/5107)  
**Tech Stack:** Next.js (Frontend) + Django Ninja (Backend)

## 1. Product Overview

### 1.1 Purpose
The Music Genre Classification Platform is a web application that allows users to upload an audio file and receive accurate genre predictions using machine learning models. 

**V1 Goal**: Deliver a functional, user-friendly MVP that uses the pre-trained Hugging Face model (`dima806/music_genres_classification`) while laying the architectural foundation for multiple models (as proposed in the final year project).

### 1.2 Objectives
- Provide a clean, responsive web interface for audio upload and genre classification.
- Demonstrate real-time (or near real-time) inference using a strong pre-trained model.
- Establish a scalable and maintainable full-stack architecture (Next.js + Django Ninja).
- Prepare the system for easy integration of additional models (Random Forest and Custom CNN) in V2.
- Serve as a working demo for the project proposal.

## 2. Features

### 2.1 Core Features (V1)

**User Features:**
- Drag & drop or browse audio file upload (mp3, wav, ogg, flac, m4a)
- File validation (max 30MB, supported formats only)
- Model Selector Dropdown:
  - `dima806/music_genres_classification` → **Active**
  - Custom CNN Model → **Unavailable** (disabled)
  - Random Forest Model → **Unavailable** (disabled)
- Display Top Prediction with confidence percentage
- Show Top 5 predictions with confidence scores
- Loading state with progress indicator
- Error handling and user-friendly messages
- Responsive design (mobile + desktop)

**Admin / Technical Features:**
- Backend API endpoint for classification
- Model switching logic ready for future models
- Proper logging and error tracking
- CORS enabled for frontend-backend communication

### 2.2 Model Selector Behavior (V1)
- Users can see all three model options mentioned in the project documentation.
- Only `dima806/music_genres_classification` is selectable and functional.
- Other options appear in the dropdown but are **disabled** with a tooltip:  
  *"This model will be available in V2 after training and integration."*

## 3. Technical Requirements

### 3.1 Architecture
- **Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **Backend**: Django 5 + Django Ninja
- **Model Serving**: Hugging Face Transformers (`dima806/music_genres_classification`)
- **Communication**: REST API via Django Ninja
- **Deployment Ready**: Designed for easy deployment (Render, Railway, Vercel + Render combination)

### 3.2 Backend Requirements
- Single POST endpoint: `/api/classify/`
- Accept audio file upload
- Support model selection via request parameter (`model_name`)
- Return standardized JSON response
- Efficient model loading (load model once at startup)
- Temporary file handling and cleanup
- Input validation and security

### 3.3 Frontend Requirements
- Modern, dark-themed UI (music-friendly)
- Clean upload component with drag & drop
- Model selection UI (dropdown or cards)
- Results page/section with clear visualization
- Responsive and accessible

## 4. User Flow (V1)

1. User lands on homepage
2. Selects desired model (only one available)
3. Uploads audio file
4. Sees loading animation
5. Receives results:
   - Main genre + large confidence %
   - List of top 5 predictions
6. Option to upload another file

## 5. API Specification (V1)

**Endpoint:** `POST /api/classify/`

**Request:**
- `file`: Audio file (multipart/form-data)
- `model_name`: string (default: `"dima806/music_genres_classification"`)

**Success Response:**
```json
{
  "success": true,
  "model_used": "dima806/music_genres_classification",
  "filename": "song.mp3",
  "top_prediction": {
    "label": "Hip-Hop",
    "score": 0.8923
  },
  "predictions": [
    {"label": "Hip-Hop", "score": 0.8923},
    {"label": "Reggae", "score": 0.0451},
    ...
  ]
}