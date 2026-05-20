
# Music Genre Classification System

A full-stack web application that classifies music genres using Machine Learning and Deep Learning models. Built as a Final Year Project (SEN/20/5107).

![Project Banner](https://via.placeholder.com/800x300/1a1a2e/0ea5e9?text=Music+Genre+Classifier)

## ✨ Overview

This platform allows users to upload an audio file and instantly receive accurate genre predictions. It implements both traditional data mining techniques and modern deep learning approaches for music genre classification — as proposed in the project documentation.

**V1** currently uses a strong pre-trained Hugging Face model, with full support for custom models planned in **V2**.

---

## 🚀 Features

### Current (V1)
- Drag & drop audio file upload (MP3, WAV, OGG, FLAC, M4A)
- Fast genre classification using `dima806/music_genres_classification`
- Top 5 predictions with confidence scores
- Clean, modern, responsive UI
- Model selector UI (ready for V2)
- Built with Next.js + Django Ninja

### Planned (V2)
- Custom-trained CNN (Spectrogram-based)
- Random Forest (Hand-crafted features)
- Side-by-side model comparison
- Performance metrics dashboard
- Feature visualization

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui (recommended)

### Backend
- **Django 5**
- **Django Ninja**
- Python 3.10+

### Machine Learning
- Hugging Face Transformers (`dima806/music_genres_classification`)
- Librosa (audio processing)
- PyTorch / TensorFlow (for custom models)
- Scikit-learn (Random Forest)

---

## 📁 Project Structure

```bash
music-genre-classifier/
├── backend/                  # Django Ninja API
│   ├── project/
│   ├── api/
│   ├── models/
│   └── requirements.txt
│
├── frontend/                 # Next.js Application
│   ├── app/
│   ├── components/
│   └── public/
│
├── models/                   # Trained model files (.pt, .h5, .joblib)
├── notebooks/                # Jupyter notebooks for training
├── data/                     # GTZAN dataset
└── docs/                     # PRDs and documentation
```

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/music-genre-classifier.git
cd music-genre-classifier
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start Django server
python manage.py runserver
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

---

## 🌐 How to Use

1. Open [http://localhost:3000](http://localhost:3000)
2. Select a model (only Hugging Face model works in V1)
3. Upload an audio file (max 30MB recommended)
4. Get instant genre prediction with confidence scores

---

## 📡 API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/api/classify/`      | Classify uploaded audio file   |

**Request Body**: `multipart/form-data` with `file` and optional `model_name`

---

## 📊 Models Status

| Model                              | Status      | Type              | Notes |
|------------------------------------|-------------|-------------------|-------|
| dima806/music_genres_classification | ✅ Active   | Deep Learning     | V1 Baseline |
| Custom CNN                         | 🔴 Planned  | Deep Learning     | V2 |
| Random Forest                      | 🔴 Planned  | Data Mining       | V2 |

---
