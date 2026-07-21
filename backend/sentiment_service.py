from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# load the pre-trained BERT sentiment model
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    text = data.get('text', '')
    
    if not text.strip():
        return jsonify({ 'sentiment': 'Neutral', 'score': 0 })
    
    result = sentiment_pipeline(text[:512])[0]  # BERT max 512 tokens
    
    # Map labels to Positive/Neutral/Negative
    label_map = {
        'positive': 'Positive',
        'neutral': 'Neutral', 
        'negative': 'Negative',
        'LABEL_0': 'Negative',
        'LABEL_1': 'Neutral',
        'LABEL_2': 'Positive',
    }
    
    sentiment = label_map.get(result['label'].lower(), 'Neutral')
    return jsonify({ 'sentiment': sentiment, 'score': result['score'] })

if __name__ == '__main__':
    app.run(port=5001)