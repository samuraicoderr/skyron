# Product Requirements Document (PRD) - V2

**Project Title:** Music Genre Classification System  
**Version:** V2.0  
**Date:** May 19, 2026  
**Author:** KING-AYINDE OBANLALOLORUN JEDIDIAH (SEN/20/5107)  
**Tech Stack:** Next.js (Frontend) + Django Ninja (Backend)

## 1. Product Overview

### 1.1 Purpose
V2 builds upon the successful V1 MVP by implementing and integrating the **custom-trained models** proposed in the original project document. This version delivers the full hybrid system comparing traditional Data Mining and Deep Learning approaches.

**V2 Goal**: Create a complete, production-like Music Genre Classification platform with multiple trained models, model comparison capabilities, and improved performance.

### 1.2 Objectives
- Train and integrate a **Custom CNN** model using spectrograms.
- Train and integrate a **Random Forest** model using hand-crafted audio features.
- Enable seamless switching between all three models in the UI.
- Provide model comparison and performance insights.
- Demonstrate the strengths and weaknesses of each approach as stated in the project proposal.
- Prepare the system for potential extension to Nigerian genres (Fuji, Apala, Afrobets, etc.).

## 2. Models in V2

| Model Name                        | Type               | Feature Type          | Status in V2     | Notes |
|-----------------------------------|--------------------|-----------------------|------------------|-------|
| dima806/music_genres_classification | Pre-trained (HF)  | Deep Learning         | Available        | Baseline |
| Custom CNN                        | Trained by Student | Spectrograms (Mel)    | Available        | Primary DL model |
| Random Forest                     | Trained by Student | MFCCs + Handcrafted   | Available        | Data Mining model |

## 3. New Features in V2

### 3.1 Core New Features
- **Multi-Model Selection**: Users can freely switch between all three models.
- **Model Comparison Mode**: Side-by-side comparison of predictions from multiple models on the same audio file.
- **Detailed Results Dashboard**:
  - Confidence scores
  - Top 5 predictions per model
  - Feature visualization (for Random Forest and CNN)
- **Performance Metrics View** (for academic/demo purposes):
  - Accuracy, Precision, Recall, F1-Score per model
  - Confusion Matrix (viewable)
  - Inference time comparison
- **Training History / Model Info**: Basic metadata about each model (training date, accuracy on GTZAN, etc.)

### 3.2 Enhanced User Flow
1. User selects one or multiple models
2. Uploads audio file
3. System processes with selected model(s)
4. Displays rich results with comparison (if multiple models chosen)
5. Option to download prediction report

## 4. Training & Implementation Requirements

### 4.1 Custom CNN Model
- Input: Mel-spectrograms (generated via Librosa)
- Architecture: Multiple Conv2D layers + MaxPooling + Dropout + Dense layers
- Trained on: GTZAN dataset (10 genres)
- Framework: TensorFlow / Keras or PyTorch
- Integration: Save model as `.h5` or `.pt` and load via Django Ninja
- Must support inference on 3–30 second audio clips

### 4.2 Random Forest Model
- Features: MFCCs (13–40), Spectral Centroid, Chroma, Roll-off, Zero Crossing Rate, Tempo, etc.
- Feature extraction using **Librosa**
- Training: Scikit-learn Random Forest
- Optional: PySpark MLlib version for scalability demonstration
- Integration: Save model as `.joblib` and load in Django

### 4.3 Backend Enhancements (Django Ninja)
- Dynamic model loader (factory pattern recommended)
- Support for multiple models running in memory
- New endpoint or parameter: `model_name` with options:
  - `huggingface`
  - `custom_cnn`
  - `random_forest`
- Feature extraction service for Random Forest
- Spectrogram generation service for CNN

### 4.4 Frontend Enhancements (Next.js)
- Improved Model Selector (cards or tabs with status)
- Comparison toggle switch
- Rich results UI with tabs or split view
- Loading states per model
- Dark, modern music-themed interface

## 5. API Specification Updates (V2)

**Endpoint:** `POST /api/classify/`

**New Parameters:**
- `model_name`: `"huggingface" | "custom_cnn" | "random_forest"`
- `compare`: boolean (if true, runs all available models)

**Response** will include model-specific metadata.

## 6. Scope for V2

**In Scope:**
- Training both Custom CNN and Random Forest on GTZAN
- Full integration and switching
- Model comparison interface
- Basic performance visualization

**Out of Scope (V3):**
- Real-time streaming classification
- Full Nigerian genres dataset training
- User authentication & history saving
- Mobile app
- Production deployment optimization

## 7. Success Criteria for V2
- All three models functional and switchable
- Custom CNN outperforms or matches Hugging Face baseline
- Random Forest model works with clear feature importance visualization
- Clean side-by-side comparison available
- System is stable and well-documented
- Ready for project defense and supervisor presentation

## 8. Risks & Dependencies
- GPU availability for CNN training
- Time required for proper hyperparameter tuning
- Model size vs inference speed trade-off
- Consistency in audio preprocessing across models

