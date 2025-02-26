from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer, util
from transformers import GPT2LMHeadModel, GPT2Tokenizer
import torch

app = Flask(__name__)

# Load free models
retriever = SentenceTransformer('all-MiniLM-L6-v2')  # Free embedding model
tokenizer = GPT2Tokenizer.from_pretrained('gpt2')     # Free GPT-2 model
generator = GPT2LMHeadModel.from_pretrained('gpt2')

def retrieve_context(document, query, top_k=3):
    sentences = document.split('. ')
    sentence_embeddings = retriever.encode(sentences, convert_to_tensor=True)
    query_embedding = retriever.encode(query, convert_to_tensor=True)
    cos_scores = util.cos_sim(query_embedding, sentence_embeddings)[0]
    top_results = torch.topk(cos_scores, k=min(top_k, len(sentences)))
    return [sentences[idx] for idx in top_results.indices]

def generate_response(context, query):
    if len(context) == 0:
        return "No information is informed."
    print("-----------------context-------------------")
    print(context)
    
    prompt = (
        f"Answer the query strictly based on the information provided in the context. If the context does not contain the information, answer with 'no information informed'. \n Context: <{context}> \n Query: {query} Answer:"
    )

    inputs = tokenizer.encode(prompt, return_tensors='pt')

    print("-----------------inputs-------------")
    print(prompt)
    outputs = generator.generate(
        inputs,
        max_length=100,
        num_return_sequences=1,
        no_repeat_ngram_size=2,
        pad_token_id=tokenizer.eos_token_id
    )
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Check if the response contains "No information is informed" as a fallback if the context doesn't provide an answer
    answer = result.split("Answer:")[-1].strip()
    if not answer:
        return "No information is informed."
    return answer

@app.route('/rag', methods=['POST'])
def rag_endpoint():
    data = request.get_json()
    document = data.get('document', '')
    query = data.get('query', '')

    if not document or not query:
        return jsonify({"error": "Missing document or query"}), 400

    # Retrieve relevant context
    context_sentences = retrieve_context(document, query)
    context = ". ".join(context_sentences) + "."

    # Generate response with GPT-2
    response = generate_response(context, query)
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
