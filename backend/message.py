from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
import os

app = Flask(__name__)

texts = [
    "hello", "hi", "hey",
    "who are you",
    "bye",

    "tomato pest", "pest in tomato", "insects in tomato",
    "rice pest", "pest in rice",
    "cotton pest",
    "maize pest",
    "chilli pest",

    "yellow leaves", "leaves turning yellow",
    "leaf spots", "spots on leaves",
    "leaf curl",

    "fertilizer for tomato",
    "fertilizer for rice",
    "organic fertilizer",

    "irrigation", "watering plants"
]

labels = [
    "greeting", "greeting", "greeting",
    "about",
    "bye",

    "tomato_pest", "tomato_pest", "tomato_pest",
    "rice_pest", "rice_pest",
    "cotton_pest",
    "maize_pest",
    "chilli_pest",

    "yellow_leaves", "yellow_leaves",
    "leaf_spots", "leaf_spots",
    "leaf_curl",

    "fert_tomato",
    "fert_rice",
    "organic_fert",

    "irrigation", "irrigation"
]

vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts)

model = MultinomialNB()
model.fit(X, labels)

responses = {
    "greeting": "Hi! How can I help you?",
    "about": "I am your agriculture assistant chatbot.",
    "bye": "Goodbye! Take care 🌱",

    "tomato_pest": "Spray Neem oil 3% or Chlorantraniliprole 0.3 ml/L",
    "rice_pest": "Use Chlorpyrifos 2ml/L",
    "cotton_pest": "Apply Imidacloprid 0.5 ml/L",
    "maize_pest": "Use Spinosad 0.5 ml/L",
    "chilli_pest": "Spray Neem oil or Emamectin Benzoate",

    "yellow_leaves": "Possible nitrogen deficiency. Add urea fertilizer",
    "leaf_spots": "Use Mancozeb fungicide 2g/L",
    "leaf_curl": "Caused by whiteflies. Use Imidacloprid",

    "fert_tomato": "Use NPK 19:19:19 or compost",
    "fert_rice": "Use urea and potash",
    "organic_fert": "Use vermicompost",

    "irrigation": "Water plants early morning or evening"
}

@app.route("/", methods=["GET"])
def home():
    return "Server running"

@app.route("/sms", methods=["POST"])
def sms_reply():
    incoming_msg = request.form.get("Body").strip().lower()

    X_test = vectorizer.transform([incoming_msg])
    intent = model.predict(X_test)[0]

    reply = responses.get(intent, "Sorry, I don't understand.")

    resp = MessagingResponse()
    resp.message(reply)

    return str(resp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))