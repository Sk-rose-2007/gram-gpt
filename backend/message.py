from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse

app = Flask(__name__)

qa = {
    "hello": "Hi! How can I help you?",
    "hi": "Hello! What do you need?",
    "who are you": "I am your agriculture assistant chatbot.",
    "bye": "Goodbye! Take care 🌱",

    "tomato pest": "Spray Neem oil 3% or Chlorantraniliprole 0.3 ml/L",
    "rice pest": "Use Chlorpyrifos 2ml/L or Triazophos",
    "cotton pest": "Apply Imidacloprid 0.5 ml/L",
    "maize pest": "Use Spinosad 0.5 ml/L",
    "chilli pest": "Spray Neem oil or Emamectin Benzoate",

    "leaf curl": "Caused by whiteflies. Use Imidacloprid spray",
    "yellow leaves": "Possible nitrogen deficiency. Add urea fertilizer",
    "leaf spots": "Use Mancozeb fungicide 2g/L",
    "plant drying": "Check for root rot. Reduce overwatering",

    "fertilizer for tomato": "Use NPK 19:19:19 or compost",
    "fertilizer for rice": "Use urea and potash as per stage",
    "organic fertilizer": "Use vermicompost or cow dung manure",

    "irrigation": "Water plants early morning or evening",
    "overwatering": "Reduce watering to avoid root damage",

    "weather": "Check local weather updates before spraying",
    "rain effect": "Avoid spraying before rain",

    "help": "You can ask about pests, crops, fertilizers",
    "thanks": "You're welcome 😊"
}

@app.route("/", methods=["GET"])
def home():
    return "Server running"

@app.route("/sms", methods=["POST"])
def sms_reply():
    incoming_msg = request.form.get("Body").strip().lower()

    reply = None

    for key in qa:
        words = key.split()
        if all(word in incoming_msg for word in words):
            reply = qa[key]
            break

    if not reply:
        reply = "Sorry, Try it in app later! once you get internet or Tell it correctly."

    resp = MessagingResponse()
    resp.message(reply)

    return str(resp)

if __name__ == "__main__":
    app.run(port=5000)